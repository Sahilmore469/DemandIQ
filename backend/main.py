"""
DemandIQ - FastAPI REST Backend
Exposes endpoints for dashboard analytics, product details, model metrics, and recursive multi-day forecasting.
"""

import os
import sys
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure backend directory is in path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from forecasting import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models and data once at server startup."""
    engine.initialize()
    yield

app = FastAPI(
    title="DemandIQ Forecasting API",
    description="Intelligent Product Demand Forecasting & Analytics Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request & Response Pydantic models
class ForecastRequest(BaseModel):
    stock_code: str = Field(..., description="StockCode of the product to forecast", example="15036")
    model_name: str = Field(..., description="Name or identifier of the ML model", example="CatBoost")
    horizon: int = Field(default=14, ge=1, le=90, description="Forecast horizon in days (1 to 90)", example=14)

class ForecastDetailItem(BaseModel):
    date: str
    day_name: str
    day_of_week: int
    predicted_demand: float
    lag_1: float
    lag_7: float
    rolling_mean_7: float
    rolling_mean_28: float
    is_weekend: int

class HistoricalContextItem(BaseModel):
    date: str
    actual_demand: float

class ForecastResponse(BaseModel):
    product_code: str
    product_description: str
    selected_model: str
    model_id: str
    horizon: int
    forecast_dates: List[str]
    predicted_demand: List[float]
    total_predicted_demand: float
    average_predicted_demand: float
    detailed_forecast: List[ForecastDetailItem]
    historical_context: List[HistoricalContextItem]

# --- API Endpoints ---

@app.get("/api/health", tags=["System"])
def get_health():
    """Health check endpoint indicating model loading status and catalog availability."""
    models_loaded = list(engine.models.keys())
    return {
        "status": "healthy",
        "service": "DemandIQ Backend",
        "version": "1.0.0",
        "models_count": len(models_loaded),
        "models_loaded": models_loaded,
        "products_count": len(engine.descriptions),
        "data_records": len(engine.df) if engine.df is not None else 0
    }

@app.get("/api/dashboard", tags=["Analytics"])
def get_dashboard():
    """Returns high-level business KPIs, overall demand and revenue trends, and top products."""
    try:
        return engine.get_dashboard_summary()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard data: {str(e)}"
        )

@app.get("/api/products", tags=["Products"])
def list_products():
    """Returns list of all 30 products with demand totals, prices, and evaluation metrics."""
    try:
        return engine.get_products()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve products list: {str(e)}"
        )

@app.get("/api/products/{stock_code}", tags=["Products"])
def get_product(stock_code: str):
    """Returns granular analytics for a specific product including weekly and monthly patterns."""
    detail = engine.get_product_detail(stock_code)
    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with StockCode '{stock_code}' was not found in dataset."
        )
    return detail

@app.get("/api/products/{stock_code}/history", tags=["Products"])
def get_product_history(stock_code: str, limit: Optional[int] = Query(None, ge=1, le=1000)):
    """Returns daily historical demand, revenue, and rolling statistics for a product."""
    history = engine.get_product_history(stock_code, limit=limit)
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No historical records found for product '{stock_code}'."
        )
    return history

@app.get("/api/models", tags=["Machine Learning"])
def list_models():
    """Lists the 6 pre-trained machine learning models with specifications and availability."""
    return engine.get_models_list()

@app.get("/api/model-metrics", tags=["Machine Learning"])
def get_model_metrics():
    """Returns benchmark comparison metrics (MAE, RMSE, R2, WAPE) across all models."""
    return engine.get_model_metrics()

@app.post("/api/forecast", response_model=ForecastResponse, tags=["Forecasting"])
def create_forecast(req: ForecastRequest):
    """
    Performs genuine recursive multi-day demand forecasting.
    Iteratively projects demand, recalculating calendar and autoregressive lag/rolling features each day.
    """
    try:
        result = engine.forecast_demand(
            stock_code=req.stock_code,
            model_name=req.model_name,
            horizon=req.horizon
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecasting calculation failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
