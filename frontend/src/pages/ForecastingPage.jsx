import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  Cpu,
  Calendar,
  Download,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpRight,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

import api from '../services/api';
import ErrorState from '../components/ErrorState';
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '../components/LoadingSkeleton';

export const ForecastingPage = () => {
  const [searchParams] = useSearchParams();
  const queryProduct = searchParams.get('product');

  // Form states
  const [products, setProducts] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedModel, setSelectedModel] = useState('CatBoost');
  const [horizon, setHorizon] = useState(14);

  // Execution states
  const [loadingInit, setLoadingInit] = useState(true);
  const [forecasting, setForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);
  const [error, setError] = useState(null);

  // Load products catalog and models catalog
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        setLoadingInit(true);
        const [prodList, modelList] = await Promise.all([
          api.getProducts(),
          api.getModels(),
        ]);

        if (!isMounted) return;
        setProducts(prodList);
        setModels(modelList);

        if (queryProduct && prodList.some(p => p.stock_code === queryProduct)) {
          setSelectedProduct(queryProduct);
        } else if (prodList.length > 0) {
          setSelectedProduct(prodList[0].stock_code);
        }
      } catch (err) {
        if (isMounted) setError('Failed to load initial catalog or models.');
      } finally {
        if (isMounted) setLoadingInit(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [queryProduct]);

  // Trigger forecast
  const handleForecast = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProduct || !selectedModel) return;

    try {
      setForecasting(true);
      setError(null);

      const res = await api.createForecast({
        stock_code: selectedProduct,
        model_name: selectedModel,
        horizon: Number(horizon),
      });

      setForecastResult(res);
    } catch (err) {
      console.error('Forecasting error:', err);
      setError(err?.response?.data?.detail || err.message || 'Forecasting failed.');
    } finally {
      setForecasting(false);
    }
  };

  useEffect(() => {
    if (selectedProduct && selectedModel && !forecastResult && !loadingInit) {
      handleForecast();
    }
  }, [selectedProduct, selectedModel, loadingInit]);

  // Export forecast to CSV
  const handleExportCSV = () => {
    if (!forecastResult) return;

    const headers = [
      'StockCode',
      'Product_Description',
      'Model',
      'Date',
      'Day_Name',
      'Day_Of_Week',
      'Predicted_Demand',
      'Lag_1',
      'Lag_7',
      'Rolling_Mean_7',
      'Rolling_Mean_28',
      'Is_Weekend'
    ];

    const rows = forecastResult.detailed_forecast.map((row) => [
      `"${forecastResult.product_code}"`,
      `"${forecastResult.product_description.replace(/"/g, '""')}"`,
      `"${forecastResult.selected_model}"`,
      row.date,
      row.day_name,
      row.day_of_week,
      row.predicted_demand,
      row.lag_1,
      row.lag_7,
      row.rolling_mean_7,
      row.rolling_mean_28,
      row.is_weekend
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DemandIQ_Forecast_${forecastResult.product_code}_${forecastResult.selected_model}_${forecastResult.horizon}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loadingInit) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <ChartSkeleton height="h-80" />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  // Prepare unified time-series chart data (History + Forecast)
  let chartData = [];
  let splitDate = null;

  if (forecastResult) {
    const history = forecastResult.historical_context || [];
    const forecast = forecastResult.detailed_forecast || [];

    splitDate = history.length > 0 ? history[history.length - 1].date : null;

    history.forEach((pt) => {
      chartData.push({
        date: pt.date,
        actual_demand: pt.actual_demand,
        predicted_demand: null,
      });
    });

    if (history.length > 0 && forecast.length > 0) {
      chartData[chartData.length - 1].predicted_demand = chartData[chartData.length - 1].actual_demand;
    }

    forecast.forEach((pt) => {
      chartData.push({
        date: pt.date,
        actual_demand: null,
        predicted_demand: pt.predicted_demand,
      });
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Configuration Header Card */}
      <div className="bg-white dark:bg-[#121720] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Demand Forecasting Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Simulate future demand using trained ML models. Each day's forecast recursively recalculates calendar, lag, and rolling features.
          </p>
        </div>

        <form onSubmit={handleForecast} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Product Selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Product SKU
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#10b981]"
            >
              {products.map((p) => (
                <option key={p.stock_code} value={p.stock_code}>
                  {p.stock_code} – {p.description}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selector */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              ML Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#10b981]"
            >
              <option value="CatBoost">CatBoost (Lowest MAE: 79.85)</option>
              <option value="XGBoost">XGBoost (Fast Boosting - MAE: 83.70)</option>
              <option value="Random Forest">Random Forest (Best RMSE / R²)</option>
              <option value="Linear Regression">Linear Regression</option>
              <option value="Decision Tree">Decision Tree</option>
              <option value="KNN">K-Nearest Neighbors (KNN)</option>
            </select>
          </div>

          {/* Horizon Selector */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Horizon
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              {[7, 14, 30].map((h) => (
                <button
                  type="button"
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                    horizon === h
                      ? 'bg-white dark:bg-[#121720] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {h}d
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="md:col-span-12 flex justify-end pt-2">
            <button
              type="submit"
              disabled={forecasting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs shadow-md shadow-[#10b981]/25 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {forecasting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Computing Multi-Day Forecast...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>Generate Forecast ({horizon} Days)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <ErrorState
          title="Forecasting Error"
          message={error}
          onRetry={handleForecast}
        />
      )}

      {/* Forecast Output */}
      {forecastResult && !error && (
        <div className="space-y-6">
          {/* Pastel Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl p-5 bg-[#dff5ec] dark:bg-[#112c22] border border-[#c4eedb] dark:border-[#1d4d3c]">
              <span className="text-xs font-semibold text-[#065f46] dark:text-[#34d399] uppercase tracking-wider">
                Total Projected Demand
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {Number(forecastResult.total_predicted_demand).toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
              </div>
              <p className="text-[11px] text-[#065f46] dark:text-[#34d399] font-medium mt-1">
                Next {forecastResult.horizon} calendar days
              </p>
            </div>

            <div className="rounded-3xl p-5 bg-[#ffe8ec] dark:bg-[#31141c] border border-[#ffd1d9] dark:border-[#561d2b]">
              <span className="text-xs font-semibold text-[#9f1239] dark:text-[#fda4af] uppercase tracking-wider">
                Average Daily Demand
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {forecastResult.average_predicted_demand} <span className="text-xs font-normal text-slate-500">units/day</span>
              </div>
              <p className="text-[11px] text-[#9f1239] dark:text-[#fda4af] font-medium mt-1">
                Expected daily velocity
              </p>
            </div>

            <div className="rounded-3xl p-5 bg-[#fff3d6] dark:bg-[#33240e] border border-[#fee4a5] dark:border-[#573c16]">
              <span className="text-xs font-semibold text-[#92400e] dark:text-[#fde047] uppercase tracking-wider">
                Active Architecture
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#92400e] dark:text-[#fde047]" />
                <span>{forecastResult.selected_model}</span>
              </div>
              <p className="text-[11px] text-[#92400e] dark:text-[#fde047] font-medium mt-1">
                Loaded from disk
              </p>
            </div>

            <div className="rounded-3xl p-5 bg-[#eee8fc] dark:bg-[#23183a] border border-[#dcd0f9] dark:border-[#3d2b63]">
              <span className="text-xs font-semibold text-[#5b21b6] dark:text-[#c4b5fd] uppercase tracking-wider">
                Target Product SKU
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono truncate">
                {forecastResult.product_code}
              </div>
              <p className="text-[11px] text-[#5b21b6] dark:text-[#c4b5fd] font-medium mt-1 truncate" title={forecastResult.product_description}>
                {forecastResult.product_description}
              </p>
            </div>
          </div>

          {/* Unified Chart Card */}
          <div className="bg-white dark:bg-[#121720] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Historical vs. Projected Demand Curve
                </h3>
                <p className="text-xs text-slate-400">
                  Grey curve indicates 30 days of actual historical sales; Green curve represents recursive model forecasts.
                </p>
              </div>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Forecast CSV</span>
              </button>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="forecastMintGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickFormatter={(str) => str.slice(5)} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      color: '#0f172a',
                    }}
                    formatter={(val, name) => [
                      `${Number(val).toFixed(1)} units`,
                      name === 'actual_demand' ? 'Historical Actual' : 'Predicted Forecast'
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1">
                        {value === 'actual_demand' ? 'Historical Actual Demand (30d)' : `Recursive Forecast (${forecastResult.selected_model})`}
                      </span>
                    )}
                  />
                  {splitDate && (
                    <ReferenceLine
                      x={splitDate}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{ value: 'Forecast Start', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="actual_demand"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    fill="#f1f5f9"
                    className="dark:fill-slate-800/50"
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted_demand"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#forecastMintGrad)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white dark:bg-[#121720] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Step-by-Step Recursive Forecast Log
                </h3>
                <p className="text-xs text-slate-400">
                  Dynamic features computed per future day
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {forecastResult.detailed_forecast.length} steps simulated
              </span>
            </div>

            <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Day</th>
                    <th className="py-2.5 px-3 text-right">Predicted Demand</th>
                    <th className="py-2.5 px-3 text-right">Lag 1</th>
                    <th className="py-2.5 px-3 text-right">Lag 7</th>
                    <th className="py-2.5 px-3 text-right">7d Rolling Mean</th>
                    <th className="py-2.5 px-3 text-center">Day Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {forecastResult.detailed_forecast.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{row.date}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">{row.day_name}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#10b981]">{row.predicted_demand.toFixed(2)} units</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{row.lag_1.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{row.lag_7.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{row.rolling_mean_7.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.is_weekend
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {row.is_weekend ? 'Weekend' : 'Weekday'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastingPage;
