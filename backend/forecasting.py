"""
DemandIQ - Forecasting and Data Management Engine
Handles model loading, recursive multi-day forecasting, and dataset aggregation.
"""

import os
import json
import logging
from datetime import timedelta
from typing import Dict, List, Any, Optional

import numpy as np
import pandas as pd
import joblib

logger = logging.getLogger("demandiq.forecasting")
logging.basicConfig(level=logging.INFO)

# File paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_CSV = os.path.join(BASE_DIR, "demandiq_processed_data.csv")
if not os.path.exists(DATA_CSV):
    DATA_CSV = os.path.join(BASE_DIR, "data", "demandiq_processed_data.csv")

MODEL_COMPARISON_CSV = os.path.join(BASE_DIR, "model_comparison.csv")
if not os.path.exists(MODEL_COMPARISON_CSV):
    MODEL_COMPARISON_CSV = os.path.join(BASE_DIR, "data", "model_comparison.csv")

DESCRIPTIONS_JSON = os.path.join(BASE_DIR, "product_descriptions.json")
if not os.path.exists(DESCRIPTIONS_JSON):
    DESCRIPTIONS_JSON = os.path.join(BASE_DIR, "data", "product_descriptions.json")

MODEL_CONFIGS = {
    "catboost": {
        "id": "catboost",
        "name": "CatBoost",
        "filename": "catboost.joblib",
        "type": "Gradient Boosted Trees (Categorical Native)",
        "description": "High-accuracy gradient boosting with native categorical feature handling. Lowest MAE overall.",
    },
    "xgboost": {
        "id": "xgboost",
        "name": "XGBoost",
        "filename": "xgboost.joblib",
        "type": "Extreme Gradient Boosting",
        "description": "Optimized distributed gradient boosting library. Second-best MAE and competitive RMSE.",
    },
    "random_forest": {
        "id": "random_forest",
        "name": "Random Forest",
        "filename": "random_forest.joblib",
        "type": "Ensemble Bagging",
        "description": "Ensemble of decision trees. Best overall RMSE and highest R² score among all models.",
    },
    "linear_regression": {
        "id": "linear_regression",
        "name": "Linear Regression",
        "filename": "linear_regression.joblib",
        "type": "Linear Model",
        "description": "Standard regularized linear baseline capturing global feature coefficients.",
    },
    "decision_tree": {
        "id": "decision_tree",
        "name": "Decision Tree",
        "filename": "decision_tree.joblib",
        "type": "Single Tree Regressor",
        "description": "Fast, interpretable hierarchical decision tree regressor.",
    },
    "knn": {
        "id": "knn",
        "name": "KNN (K-Nearest Neighbors)",
        "filename": "knn.joblib",
        "type": "Instance-based Learning",
        "description": "Non-parametric distance-based regression finding nearest historical demand states.",
    },
}

FEATURE_COLS = [
    "StockCode",
    "Day",
    "Month",
    "DayOfWeek",
    "WeekOfYear",
    "IsWeekend",
    "Average_Price",
    "Lag_1",
    "Lag_7",
    "Lag_14",
    "Lag_28",
    "Rolling_Mean_7",
    "Rolling_Mean_28",
]

class DemandIQEngine:
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.df: Optional[pd.DataFrame] = None
        self.descriptions: Dict[str, str] = {}
        self.model_comparison_df: Optional[pd.DataFrame] = None
        self.product_evaluation_metrics: Dict[str, Dict[str, float]] = {}
        self.recent_forecasts: List[Dict[str, Any]] = []

    def initialize(self):
        """Loads models, datasets, metadata and computes pre-aggregations."""
        logger.info("Initializing DemandIQ Engine...")

        # 1. Load descriptions
        if os.path.exists(DESCRIPTIONS_JSON):
            with open(DESCRIPTIONS_JSON, "r", encoding="utf-8") as f:
                self.descriptions = json.load(f)
            logger.info("Loaded %d product descriptions.", len(self.descriptions))
        else:
            logger.warning("Product descriptions file not found at %s", DESCRIPTIONS_JSON)

        # 2. Load dataset
        if os.path.exists(DATA_CSV):
            self.df = pd.read_csv(DATA_CSV)
            self.df["StockCode"] = self.df["StockCode"].astype(str)
            self.df["Date"] = pd.to_datetime(self.df["Date"])
            self.df = self.df.sort_values(["StockCode", "Date"]).reset_index(drop=True)
            logger.info("Loaded processed data with %d rows across %d unique products.",
                        len(self.df), self.df["StockCode"].nunique())
        else:
            raise FileNotFoundError(f"Missing required data file: {DATA_CSV}")

        # 3. Load model comparison CSV
        if os.path.exists(MODEL_COMPARISON_CSV):
            self.model_comparison_df = pd.read_csv(MODEL_COMPARISON_CSV)
            logger.info("Loaded model comparison table.")
        else:
            logger.warning("Model comparison CSV not found at %s", MODEL_COMPARISON_CSV)

        # 4. Load trained ML models
        for model_id, config in MODEL_CONFIGS.items():
            model_path = os.path.join(MODELS_DIR, config["filename"])
            if os.path.exists(model_path):
                try:
                    loaded_model = joblib.load(model_path)
                    self.models[model_id] = loaded_model
                    logger.info("Loaded model: %s (%s)", config["name"], config["filename"])
                except Exception as e:
                    logger.error("Failed to load model %s: %s", model_id, str(e))
            else:
                logger.warning("Model file does not exist: %s", model_path)

        # 5. Precompute product-level evaluation metrics (test set 20%)
        self._compute_product_evaluations()

        logger.info("DemandIQ Engine initialization complete!")

    def _compute_product_evaluations(self):
        """Computes test-set MAE and RMSE per product for product analytics."""
        if self.df is None or "xgboost" not in self.models:
            return

        split_date = self.df["Date"].quantile(0.80)
        test_df = self.df[self.df["Date"] > split_date].copy()

        if test_df.empty:
            return

        try:
            xgb_model = self.models["xgboost"]
            X_test = test_df[FEATURE_COLS].copy()
            X_test["StockCode"] = X_test["StockCode"].astype(str)
            test_df["Predicted_Demand"] = np.clip(xgb_model.predict(X_test), 0, None)

            grouped = test_df.groupby("StockCode")
            for stock_code, group in grouped:
                actual = group["Daily_Demand"].values
                pred = group["Predicted_Demand"].values
                mae = float(np.mean(np.abs(actual - pred)))
                rmse = float(np.sqrt(np.mean((actual - pred) ** 2)))
                denom = np.sum(np.abs(actual))
                wape = float((np.sum(np.abs(actual - pred)) / denom * 100)) if denom > 0 else 0.0

                self.product_evaluation_metrics[str(stock_code)] = {
                    "mae": round(mae, 2),
                    "rmse": round(rmse, 2),
                    "wape": round(wape, 2),
                    "test_records": len(group),
                    "avg_actual": round(float(np.mean(actual)), 2)
                }
        except Exception as e:
            logger.warning("Failed to precompute product evaluations: %s", str(e))

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Provides high-level KPIs and time-series trends for the main dashboard."""
        if self.df is None:
            raise RuntimeError("Engine not initialized.")

        total_products = int(self.df["StockCode"].nunique())
        total_records = int(len(self.df))
        total_demand = float(self.df["Daily_Demand"].sum())
        total_revenue = float(self.df["Daily_Revenue"].sum())

        # Daily aggregated trends
        daily_agg = self.df.groupby("Date").agg({
            "Daily_Demand": "sum",
            "Daily_Revenue": "sum",
            "Total_Transactions": "sum"
        }).reset_index().sort_values("Date")

        daily_demand_trend = [
            {"date": row["Date"].strftime("%Y-%m-%d"), "demand": round(float(row["Daily_Demand"]), 2)}
            for _, row in daily_agg.iterrows()
        ]

        daily_revenue_trend = [
            {"date": row["Date"].strftime("%Y-%m-%d"), "revenue": round(float(row["Daily_Revenue"]), 2)}
            for _, row in daily_agg.iterrows()
        ]

        # Top 10 products by total demand
        prod_agg = self.df.groupby("StockCode").agg({
            "Daily_Demand": "sum",
            "Daily_Revenue": "sum",
            "Average_Price": "mean"
        }).reset_index().sort_values("Daily_Demand", ascending=False).head(10)

        top_10 = []
        for _, row in prod_agg.iterrows():
            code = str(row["StockCode"])
            top_10.append({
                "stock_code": code,
                "description": self.descriptions.get(code, f"Product {code}"),
                "total_demand": round(float(row["Daily_Demand"]), 2),
                "total_revenue": round(float(row["Daily_Revenue"]), 2),
                "average_price": round(float(row["Average_Price"]), 2),
            })

        # Model comparison summary
        model_overview = self.get_model_metrics()

        return {
            "total_products": total_products,
            "total_records": total_records,
            "total_demand": round(total_demand, 2),
            "total_revenue": round(total_revenue, 2),
            "best_model_by_mae": "CatBoost",
            "best_mae_score": 79.85,
            "best_rmse_model": "Random Forest",
            "best_rmse_score": 221.14,
            "best_r2_model": "Random Forest",
            "best_r2_score": 0.142,
            "daily_demand_trend": daily_demand_trend,
            "daily_revenue_trend": daily_revenue_trend,
            "top_10_products": top_10,
            "model_overview": model_overview[:5],
            "recent_activity": self.recent_forecasts[-5:] if self.recent_forecasts else []
        }

    def get_products(self) -> List[Dict[str, Any]]:
        """Returns list of all products with summary stats."""
        if self.df is None:
            raise RuntimeError("Engine not initialized.")

        grouped = self.df.groupby("StockCode").agg({
            "Daily_Demand": "sum",
            "Daily_Revenue": "sum",
            "Average_Price": "mean",
            "Date": ["count", "min", "max"]
        }).reset_index()

        grouped.columns = [
            "StockCode", "total_demand", "total_revenue", "avg_price",
            "record_count", "min_date", "max_date"
        ]
        grouped = grouped.sort_values("total_demand", ascending=False)

        products = []
        for _, row in grouped.iterrows():
            code = str(row["StockCode"])
            eval_metric = self.product_evaluation_metrics.get(code, {})
            products.append({
                "stock_code": code,
                "description": self.descriptions.get(code, f"Product {code}"),
                "total_demand": round(float(row["total_demand"]), 2),
                "total_revenue": round(float(row["total_revenue"]), 2),
                "average_price": round(float(row["avg_price"]), 2),
                "record_count": int(row["record_count"]),
                "min_date": row["min_date"].strftime("%Y-%m-%d"),
                "max_date": row["max_date"].strftime("%Y-%m-%d"),
                "mae": eval_metric.get("mae"),
                "rmse": eval_metric.get("rmse"),
                "wape": eval_metric.get("wape")
            })

        return products

    def get_product_detail(self, stock_code: str) -> Optional[Dict[str, Any]]:
        """Returns detailed analytics for a single product."""
        if self.df is None:
            raise RuntimeError("Engine not initialized.")

        prod_df = self.df[self.df["StockCode"] == str(stock_code)].sort_values("Date")
        if prod_df.empty:
            return None

        code = str(stock_code)
        desc = self.descriptions.get(code, f"Product {code}")
        total_demand = float(prod_df["Daily_Demand"].sum())
        total_revenue = float(prod_df["Daily_Revenue"].sum())
        avg_price = float(prod_df["Average_Price"].mean())

        # Day of week pattern
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        dow_agg = prod_df.groupby("DayOfWeek")["Daily_Demand"].mean().to_dict()
        weekly_pattern = [
            {"day_index": i, "day_name": day_names[i], "average_demand": round(float(dow_agg.get(i, 0.0)), 2)}
            for i in range(7)
        ]

        # Monthly pattern
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        m_agg = prod_df.groupby("Month")["Daily_Demand"].mean().to_dict()
        monthly_pattern = [
            {"month_index": m, "month_name": month_names[m - 1], "average_demand": round(float(m_agg.get(m, 0.0)), 2)}
            for m in range(1, 13)
        ]

        # Price trend over time
        price_trend = [
            {"date": row["Date"].strftime("%Y-%m-%d"), "price": round(float(row["Average_Price"]), 2)}
            for _, row in prod_df.iterrows()
        ]

        # Evaluation metrics
        eval_metrics = self.product_evaluation_metrics.get(code, None)

        return {
            "stock_code": code,
            "description": desc,
            "total_demand": round(total_demand, 2),
            "total_revenue": round(total_revenue, 2),
            "average_price": round(avg_price, 2),
            "min_date": prod_df["Date"].min().strftime("%Y-%m-%d"),
            "max_date": prod_df["Date"].max().strftime("%Y-%m-%d"),
            "weekly_pattern": weekly_pattern,
            "monthly_pattern": monthly_pattern,
            "price_trend": price_trend,
            "evaluation_metrics": eval_metrics
        }

    def get_product_history(self, stock_code: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Returns historical time-series records for a product."""
        if self.df is None:
            raise RuntimeError("Engine not initialized.")

        prod_df = self.df[self.df["StockCode"] == str(stock_code)].sort_values("Date")
        if prod_df.empty:
            return []

        if limit is not None and limit > 0:
            prod_df = prod_df.tail(limit)

        records = []
        for _, row in prod_df.iterrows():
            records.append({
                "date": row["Date"].strftime("%Y-%m-%d"),
                "daily_demand": round(float(row["Daily_Demand"]), 2),
                "daily_revenue": round(float(row["Daily_Revenue"]), 2),
                "average_price": round(float(row["Average_Price"]), 2),
                "total_transactions": int(row["Total_Transactions"]),
                "rolling_mean_7": round(float(row["Rolling_Mean_7"]), 2) if not pd.isna(row["Rolling_Mean_7"]) else 0.0,
                "rolling_mean_28": round(float(row["Rolling_Mean_28"]), 2) if not pd.isna(row["Rolling_Mean_28"]) else 0.0,
            })
        return records

    def get_models_list(self) -> List[Dict[str, Any]]:
        """Returns catalog of the 6 available ML models."""
        result = []
        for model_id, config in MODEL_CONFIGS.items():
            result.append({
                "id": model_id,
                "name": config["name"],
                "type": config["type"],
                "description": config["description"],
                "is_available": model_id in self.models
            })
        return result

    def get_model_metrics(self) -> List[Dict[str, Any]]:
        """Returns model comparison table with rankings and metric highlights."""
        if self.model_comparison_df is not None:
            metrics = []
            for _, row in self.model_comparison_df.iterrows():
                metrics.append({
                    "model": str(row["Model"]),
                    "mae": round(float(row["MAE"]), 2),
                    "rmse": round(float(row["RMSE"]), 2),
                    "r2_score": round(float(row["R2 Score"]), 3),
                    "wape": round(float(row["WAPE (%)"]), 2)
                })
            return metrics

        # Fallback to official results from training notebook
        return [
            {"model": "CatBoost", "mae": 79.85, "rmse": 225.90, "r2_score": 0.105, "wape": 79.08},
            {"model": "XGBoost", "mae": 83.70, "rmse": 222.96, "r2_score": 0.128, "wape": 82.89},
            {"model": "Linear Regression", "mae": 85.49, "rmse": 230.71, "r2_score": 0.066, "wape": 84.67},
            {"model": "Random Forest", "mae": 86.07, "rmse": 221.14, "r2_score": 0.142, "wape": 85.24},
            {"model": "Decision Tree", "mae": 92.65, "rmse": 250.64, "r2_score": -0.102, "wape": 91.76},
            {"model": "KNN", "mae": 94.64, "rmse": 238.12, "r2_score": 0.005, "wape": 93.72},
            {"model": "7-Day Naive Baseline", "mae": 104.25, "rmse": 290.90, "r2_score": -0.485, "wape": 103.24}
        ]

    def forecast_demand(self, stock_code: str, model_name: str, horizon: int = 14) -> Dict[str, Any]:
        """
        Executes genuine recursive multi-day forecasting.
        For each future day:
          - Generates calendar features
          - Extracts lag features (using actuals or previous predictions)
          - Extracts rolling averages using only preceding days
          - Carries forward last known average price
          - Predicts demand with saved model
          - Clips negative values to zero
          - Uses prediction as input for subsequent forecast steps
        """
        if self.df is None:
            raise RuntimeError("Engine not initialized.")

        # Normalize model key
        normalized_model_key = model_name.strip().lower().replace(" ", "_").replace("-", "_")
        # Direct lookup or alias
        if normalized_model_key not in self.models:
            # Map aliases
            alias_map = {
                "catboost": "catboost",
                "xgboost": "xgboost",
                "random_forest": "random_forest",
                "randomforest": "random_forest",
                "linear_regression": "linear_regression",
                "linearregression": "linear_regression",
                "decision_tree": "decision_tree",
                "decisiontree": "decision_tree",
                "knn": "knn",
                "k_nearest_neighbors": "knn"
            }
            normalized_model_key = alias_map.get(normalized_model_key, normalized_model_key)

        if normalized_model_key not in self.models:
            raise ValueError(f"Model '{model_name}' is not recognized or loaded. Available models: {list(self.models.keys())}")

        model = self.models[normalized_model_key]
        display_model_name = MODEL_CONFIGS.get(normalized_model_key, {}).get("name", model_name)

        prod_df = self.df[self.df["StockCode"] == str(stock_code)].sort_values("Date").copy()
        if prod_df.empty:
            raise ValueError(f"Product '{stock_code}' not found in dataset.")

        last_known_price = float(prod_df["Average_Price"].iloc[-1])
        demand_series = prod_df[["Date", "Daily_Demand"]].copy()
        last_date = demand_series["Date"].iloc[-1]

        horizon = max(1, min(horizon, 90)) # Bound horizon safely between 1 and 90 days

        forecast_results: List[Dict[str, Any]] = []
        forecast_dates: List[str] = []
        predicted_demands: List[float] = []

        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        for i in range(1, horizon + 1):
            target_date = last_date + timedelta(days=i)
            day = target_date.day
            month = target_date.month
            day_of_week = target_date.dayofweek
            week_of_year = int(target_date.isocalendar().week)
            is_weekend = 1 if day_of_week in [5, 6] else 0

            # Historical demands vector including prior steps' predictions
            demands = demand_series["Daily_Demand"].values

            lag_1 = float(demands[-1])
            lag_7 = float(demands[-7]) if len(demands) >= 7 else lag_1
            lag_14 = float(demands[-14]) if len(demands) >= 14 else lag_1
            lag_28 = float(demands[-28]) if len(demands) >= 28 else lag_1

            rolling_7 = float(np.mean(demands[-7:]))
            rolling_28 = float(np.mean(demands[-28:]))

            feature_dict = {
                "StockCode": str(stock_code),
                "Day": day,
                "Month": month,
                "DayOfWeek": day_of_week,
                "WeekOfYear": week_of_year,
                "IsWeekend": is_weekend,
                "Average_Price": last_known_price,
                "Lag_1": lag_1,
                "Lag_7": lag_7,
                "Lag_14": lag_14,
                "Lag_28": lag_28,
                "Rolling_Mean_7": rolling_7,
                "Rolling_Mean_28": rolling_28,
            }

            row_df = pd.DataFrame([feature_dict])[FEATURE_COLS]

            # Model prediction
            raw_pred = model.predict(row_df)[0]
            # Clip negative predictions to zero
            clipped_pred = max(0.0, float(raw_pred))

            date_str = target_date.strftime("%Y-%m-%d")
            forecast_dates.append(date_str)
            predicted_demands.append(round(clipped_pred, 2))

            forecast_results.append({
                "date": date_str,
                "day_name": day_names[day_of_week],
                "day_of_week": day_of_week,
                "predicted_demand": round(clipped_pred, 2),
                "lag_1": round(lag_1, 2),
                "lag_7": round(lag_7, 2),
                "rolling_mean_7": round(rolling_7, 2),
                "rolling_mean_28": round(rolling_28, 2),
                "is_weekend": is_weekend
            })

            # Append new prediction to demand_series for the next step's recursive computation
            new_record = pd.DataFrame([{"Date": target_date, "Daily_Demand": clipped_pred}])
            demand_series = pd.concat([demand_series, new_record], ignore_index=True)

        total_predicted = float(np.sum(predicted_demands))
        avg_predicted = float(np.mean(predicted_demands))

        # Recent historical context (last 30 days of actual data)
        recent_history = [
            {
                "date": row["Date"].strftime("%Y-%m-%d"),
                "actual_demand": round(float(row["Daily_Demand"]), 2)
            }
            for _, row in prod_df.tail(30).iterrows()
        ]

        desc = self.descriptions.get(str(stock_code), f"Product {stock_code}")

        result_payload = {
            "product_code": str(stock_code),
            "product_description": desc,
            "selected_model": display_model_name,
            "model_id": normalized_model_key,
            "horizon": horizon,
            "forecast_dates": forecast_dates,
            "predicted_demand": predicted_demands,
            "total_predicted_demand": round(total_predicted, 2),
            "average_predicted_demand": round(avg_predicted, 2),
            "detailed_forecast": forecast_results,
            "historical_context": recent_history
        }

        # Keep record in recent activity
        self.recent_forecasts.append({
            "product_code": str(stock_code),
            "product_description": desc,
            "model": display_model_name,
            "horizon": horizon,
            "total_predicted": round(total_predicted, 2),
            "avg_predicted": round(avg_predicted, 2),
            "timestamp": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")
        })

        return result_payload

# Global singleton engine instance
engine = DemandIQEngine()
