# DemandIQ – Intelligent Product Demand Forecasting & Analytics Platform

DemandIQ is an enterprise-grade, responsive full-stack predictive intelligence platform designed to forecast daily product demand across retail SKUs and deliver interactive business analytics.

The platform leverages six pre-trained machine learning models calibrated on the UCI Online Retail dataset, executing **genuine recursive multi-day autoregressive forecasting** while surfacing rich longitudinal dashboards, seasonality analyses, and CSV export hubs.

---

## 1. Project Overview & Architecture

### System Architecture
```
DemandIQ/
├── models/                               # Saved ML model artifacts (Joblib)
│   ├── catboost.joblib                   # CatBoostRegressor (Native categorical handling)
│   ├── xgboost.joblib                    # Scikit-learn Pipeline (OneHotEncoder + Scaler + XGBRegressor)
│   ├── random_forest.joblib              # Scikit-learn Pipeline (RandomForestRegressor)
│   ├── linear_regression.joblib          # Scikit-learn Pipeline (LinearRegression)
│   ├── decision_tree.joblib              # Scikit-learn Pipeline (DecisionTreeRegressor)
│   └── knn.joblib                        # Scikit-learn Pipeline (KNeighborsRegressor)
├── data/                                 # Datasets and metadata
│   ├── demandiq_processed_data.csv       # 10,380 cleaned daily SKU records
│   ├── model_comparison.csv              # Empirical evaluation benchmark matrix
│   └── product_descriptions.json         # SKU-to-Description catalog map
├── notebooks/                            # Exploratory data analysis & model training
│   └── Product_Demand_Forecasting.ipynb  # Full data preprocessing, feature engineering & training notebook
├── backend/                              # High-performance FastAPI server
│   ├── main.py                           # REST API routing, CORS, and Pydantic validation
│   ├── forecasting.py                    # Multi-day recursive inference engine & dataset aggregator
│   └── requirements.txt                  # Python dependencies
├── frontend/                             # Modern SaaS React application
│   ├── src/
│   │   ├── components/                   # Navbar, Sidebar, StatCards, Skeletons, Error/Empty states
│   │   ├── pages/                        # Dashboard, Forecasting, Model Comparison, Product Analytics, Reports
│   │   ├── services/                     # Axios API client
│   │   ├── hooks/                        # Dark/Light theme provider
│   │   ├── layouts/                      # App layout shell with responsive drawer
│   │   └── App.jsx                       # React Router routing
│   ├── package.json                      # Frontend dependencies & scripts
│   └── vite.config.js                    # Vite bundler & reverse proxy configuration
├── Online Retail.xlsx                    # Raw UCI source dataset
├── test_integration.py                   # Automated end-to-end integration test
└── README.md                             # Comprehensive documentation
```

---

## 2. Machine Learning Models & Benchmark

DemandIQ integrates all six pre-trained model artifacts loaded once at backend startup:

| Model | MAE | RMSE | R² Score | WAPE (%) | Key Advantage |
|:---|---:|---:|---:|---:|:---|
| **CatBoost** | **79.85** | 225.90 | 0.105 | **79.08%** | **Lowest MAE & WAPE**: Best overall unit accuracy on skewed sales |
| **XGBoost** | 83.70 | 222.96 | 0.128 | 82.89% | Second-lowest MAE, high inference velocity |
| **Linear Regression** | 85.49 | 230.71 | 0.066 | 84.67% | Interpretable parametric linear baseline |
| **Random Forest** | 86.07 | **221.14** | **0.142** | 85.24% | **Best RMSE & R²**: Maximum outlier resilience and variance capture |
| **Decision Tree** | 92.65 | 250.64 | -0.102 | 91.76% | Hierarchical single-tree decision rules |
| **KNN** | 94.64 | 238.12 | 0.005 | 93.72% | Instance-based nearest neighbor lookup |
| *7-Day Naive Baseline* | *104.25* | *290.90* | *-0.485* | *103.24%* | Prior-week persistence benchmark |

> **Note on Model Leadership:** No single model strictly dominates across every metric. CatBoost yields the lowest mean absolute error (79.85), whereas Random Forest yields the best root mean squared error (221.14) and highest coefficient of determination ($R^2 = 0.142$). DemandIQ highlights each model's distinct empirical strength.

---

## 3. Dataset Characteristics

- **Source:** UCI Online Retail Dataset (December 2010 to December 2011).
- **Scope:** 30 high-velocity products selected by aggregate transaction demand.
- **Records:** 10,380 processed product-date records (346 continuous days per product).
- **Target Variable:** `Daily_Demand` (Total units sold per product per calendar day).
- **Engineered Features:**
  - **Calendar:** `Day`, `Month`, `DayOfWeek`, `WeekOfYear`, `IsWeekend`.
  - **Price:** `Average_Price` carried forward.
  - **Autoregressive Lags:** `Lag_1`, `Lag_7`, `Lag_14`, `Lag_28`.
  - **Moving Windows:** `Rolling_Mean_7`, `Rolling_Mean_28`.

---

## 4. Genuine Recursive Multi-Day Forecasting Engine

DemandIQ implements authentic step-by-step recursive multi-day forecasting:

1. **State Initialization:** When a user requests an $H$-day forecast for product $S$ with model $M$, the engine extracts the product's continuous historical demand series up to the final historical date ($D_{\text{last}} = \text{2011-12-09}$) and carries forward the last known average selling price.
2. **Iterative Step Calculation:** For each future day $k \in [1, H]$:
   - Evaluates calendar features for timestamp $D_{\text{last}} + k$ (`Day`, `Month`, `DayOfWeek`, `WeekOfYear`, `IsWeekend`).
   - Dynamically looks up `Lag_1`, `Lag_7`, `Lag_14`, `Lag_28` from the expanding demand vector.
   - Computes rolling averages `Rolling_Mean_7` and `Rolling_Mean_28` using only preceding days.
   - Passes the exact 13-feature input vector into the selected model.
   - Clips negative values to zero ($\max(0.0, \hat{y})$).
   - Appends the predicted demand $\hat{y}_k$ to the historical demand vector so subsequent days $k+1, \dots$ recursively build upon simulated prior predictions.
3. **Historical Context:** Returns the last 30 days of actual observed demand together with future predictions for seamless visual comparison on the chart.

---

## 5. Application Pages

### Page 1: Executive Dashboard (`/`)
- High-level KPIs: Monitored Catalog (30 SKUs), Processed Records (10,380), Historical Demand (1.05M units), Gross Revenue (£1.98M).
- Model highlights: CatBoost (Best MAE: 79.85), Random Forest (Best RMSE: 221.14 / R²: 0.142).
- Interactive Area Charts: Aggregate daily demand and daily gross revenue trends with time filters (30 days, 90 days, Full year).
- Top 10 Products by Demand: Table with ranking badges, unit volume, price, revenue, and quick-forecast action buttons.

### Page 2: Demand Forecasting Engine (`/forecast`)
- Real-time simulation interface: Select any of the 30 SKUs, choose from the 6 ML models, and pick 7, 14, or 30-day forecast horizons.
- Interactive Unified Chart: Combines 30 days of actual history with the recursive projection curve and a visual origin marker.
- Metric Summary: Total Projected Demand, Average Daily Demand, Active Model, Product Info.
- Step-by-Step Table: Shows exact values computed for `Lag_1`, `Lag_7`, `Rolling_Mean_7`, and day-of-week indicators.
- CSV Download: One-click export of the simulated multi-day forecast dataset.

### Page 3: Model Comparison & Leaderboard (`/models`)
- Comprehensive Leaderboard: Metrics from `model_comparison.csv` with individual highlights for MAE, RMSE, R², and WAPE.
- Interactive Metric Comparison Visualizer: Horizontal bar charts comparing models across any chosen metric.
- Export Leaderboard CSV: Instant download of the full benchmark scorecard.

### Page 4: Product Analytics & Seasonality (`/products`)
- Individual SKU Deep-Dive: Searchable product picker across all 30 items.
- Longitudinal Charts: Daily sales history with 7-day and 28-day moving average trendlines.
- Seasonality Profiles:
  - Day-of-week demand distribution (Monday through Sunday).
  - Monthly demand volume distribution (January through December).
- Test Evaluation Card: Displays out-of-sample test error metrics (MAE, RMSE, WAPE) computed on the final 20% chronological split.
- Historical Data Table: Searchable, paginated tabular log with direct CSV download.

### Page 5: Reports & Export Hub (`/reports`)
- Report 1: Custom Multi-Day Forecast CSV Generator.
- Report 2: Full ML Benchmark Comparison Scorecard CSV.
- Report 3: 30-Product Catalog Master Performance Summary CSV.
- Report 4: Direct Single-Product Daily Historical Series CSV.

---

## 6. Backend REST API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/health` | Service health status, count of loaded models and data records |
| `GET` | `/api/dashboard` | Executive KPIs, aggregated demand/revenue trends, top 10 products |
| `GET` | `/api/products` | Catalog listing of all 30 products with summary statistics |
| `GET` | `/api/products/{stock_code}` | Granular SKU analytics, weekly/monthly seasonality, and test errors |
| `GET` | `/api/products/{stock_code}/history` | Historical daily demand, revenue, and rolling statistics |
| `GET` | `/api/models` | Specifications and operational status of all 6 ML models |
| `GET` | `/api/model-metrics` | Benchmark leaderboard metrics (MAE, RMSE, R2, WAPE) |
| `POST` | `/api/forecast` | Executes recursive multi-day demand forecasting |

### Forecast Request Schema
```json
{
  "stock_code": "20725",
  "model_name": "CatBoost",
  "horizon": 14
}
```

### Forecast Response Schema
```json
{
  "product_code": "20725",
  "product_description": "LUNCH BAG RED RETROSPOT",
  "selected_model": "CatBoost",
  "model_id": "catboost",
  "horizon": 14,
  "forecast_dates": ["2011-12-10", "2011-12-11", "..."],
  "predicted_demand": [0.0, 12.37, 55.22, "..."],
  "total_predicted_demand": 586.2,
  "average_predicted_demand": 41.87,
  "detailed_forecast": [
    {
      "date": "2011-12-10",
      "day_name": "Saturday",
      "day_of_week": 5,
      "predicted_demand": 0.0,
      "lag_1": 0.0,
      "lag_7": 0.0,
      "rolling_mean_7": 1.57,
      "rolling_mean_28": 26.11,
      "is_weekend": 1
    }
  ],
  "historical_context": [
    { "date": "2011-11-10", "actual_demand": 45.0 }
  ]
}
```

---

## 7. Setup & Execution Instructions

### Prerequisites
- Python 3.10+ (Python 3.11 recommended)
- Node.js 18+ and npm 9+

---

### Step 1: Backend Setup & Execution

1. Navigate to the project root directory:
   ```bash
   cd "DemandIQ – Intelligent Product Demand Forecasting & Analytics Platform"
   ```

2. (Optional) Activate your Python virtual environment if preferred:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Start the FastAPI backend server:
   ```bash
   python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
   ```

   The backend will start and serve API requests at `http://127.0.0.1:8000`.
   Interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`.

---

### Step 2: Frontend Setup & Execution

1. In a new terminal window, navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

   The application will be accessible in your web browser at:
   ```
   http://127.0.0.1:5173
   ```

   *Note:* The Vite development server automatically proxies all `/api` requests to `http://127.0.0.1:8000`.

---

### Step 3: Run Automated Integration Tests

To verify end-to-end communication between the frontend proxy, FastAPI backend, and all six machine learning models:
```bash
python test_integration.py
```
Expected output:
```
Testing Backend directly:
GET /api/health -> 200 {"status":"healthy", "models_count":6, ...}
POST /api/forecast (CatBoost) -> 200 Total predicted: ...

Testing Vite frontend server:
GET http://127.0.0.1:5173/ -> 200 HTML length: ...

Testing Vite Proxy to Backend:
GET http://127.0.0.1:5173/api/health -> 200 ...

Testing all 6 models via Vite proxy:
Model CatBoost: 200 OK
Model XGBoost: 200 OK
Model Random Forest: 200 OK
Model Linear Regression: 200 OK
Model Decision Tree: 200 OK
Model KNN: 200 OK

ALL SERVER INTEGRATION TESTS COMPLETED SUCCESSFULLY!
```

---

## 8. Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Recharts, Lucide React, Axios, React Router v7.
- **Backend:** Python 3.11, FastAPI, Uvicorn, Pydantic v2.
- **Machine Learning & Data Processing:** Scikit-learn, XGBoost, CatBoost, Joblib, Pandas, NumPy, OpenPyXL.
- **Storage:** Joblib serialized pipelines, CSV, JSON (Zero SQL/NoSQL database overhead).
