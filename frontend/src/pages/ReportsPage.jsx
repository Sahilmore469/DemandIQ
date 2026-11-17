import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Cpu,
  Package,
  TrendingUp,
  Sparkles,
  FileText,
  ArrowUpRight
} from 'lucide-react';
import api from '../services/api';
import ErrorState from '../components/ErrorState';
import { CardSkeleton } from '../components/LoadingSkeleton';

export const ReportsPage = () => {
  const [products, setProducts] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick forecast export form
  const [exportProduct, setExportProduct] = useState('');
  const [exportModel, setExportModel] = useState('CatBoost');
  const [exportHorizon, setExportHorizon] = useState(14);
  const [exportingForecast, setExportingForecast] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.getProducts(), api.getModels()])
      .then(([prods, mods]) => {
        if (!isMounted) return;
        setProducts(prods);
        setModels(mods);
        if (prods.length > 0) setExportProduct(prods[0].stock_code);
      })
      .catch((err) => {
        if (isMounted) setError('Failed to load metadata for reports.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Export forecast to CSV
  const handleExportForecast = async () => {
    if (!exportProduct || !exportModel) return;
    try {
      setExportingForecast(true);
      const res = await api.createForecast({
        stock_code: exportProduct,
        model_name: exportModel,
        horizon: Number(exportHorizon),
      });

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

      const rows = res.detailed_forecast.map((r) => [
        `"${res.product_code}"`,
        `"${res.product_description.replace(/"/g, '""')}"`,
        `"${res.selected_model}"`,
        r.date,
        r.day_name,
        r.day_of_week,
        r.predicted_demand,
        r.lag_1,
        r.lag_7,
        r.rolling_mean_7,
        r.rolling_mean_28,
        r.is_weekend
      ]);

      downloadCSV([headers.join(','), ...rows.map(r => r.join(','))].join('\n'), `DemandIQ_Forecast_${res.product_code}_${res.selected_model}_${res.horizon}d.csv`);
      setExportSuccessMsg(`Successfully generated forecast report for SKU ${res.product_code} (${res.selected_model})!`);
      setTimeout(() => setExportSuccessMsg(''), 4000);
    } catch (err) {
      alert('Forecast export failed: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setExportingForecast(false);
    }
  };

  // 2. Export Model Benchmark Comparison
  const handleExportModelMetrics = async () => {
    try {
      const metrics = await api.getModelMetrics();
      const headers = ['Model', 'MAE', 'RMSE', 'R2 Score', 'WAPE (%)'];
      const rows = metrics.map((m) => [
        `"${m.model}"`,
        m.mae,
        m.rmse,
        m.r2_score,
        m.wape,
      ]);
      downloadCSV([headers.join(','), ...rows.map(r => r.join(','))].join('\n'), 'DemandIQ_Model_Comparison_Benchmark.csv');
    } catch (err) {
      alert('Model metrics export failed: ' + err.message);
    }
  };

  // 3. Export 30-Product Portfolio Catalog Summary
  const handleExportProductSummary = () => {
    if (!products || products.length === 0) return;
    const headers = ['StockCode', 'Description', 'Total_Demand', 'Total_Revenue', 'Average_Price', 'Record_Count', 'Test_MAE', 'Test_RMSE', 'Test_WAPE'];
    const rows = products.map((p) => [
      `"${p.stock_code}"`,
      `"${p.description.replace(/"/g, '""')}"`,
      p.total_demand,
      p.total_revenue,
      p.average_price,
      p.record_count,
      p.mae || 'N/A',
      p.rmse || 'N/A',
      p.wape || 'N/A',
    ]);
    downloadCSV([headers.join(','), ...rows.map(r => r.join(','))].join('\n'), 'DemandIQ_Product_Catalog_Summary.csv');
  };

  // 4. Export Product Historical Time-series
  const handleExportProductHistory = async (stockCode) => {
    try {
      const records = await api.getProductHistory(stockCode);
      const headers = ['Date', 'Daily_Demand', 'Daily_Revenue', 'Average_Price', 'Total_Transactions', 'Rolling_Mean_7', 'Rolling_Mean_28'];
      const rows = records.map((r) => [
        r.date,
        r.daily_demand,
        r.daily_revenue,
        r.average_price,
        r.total_transactions,
        r.rolling_mean_7,
        r.rolling_mean_28,
      ]);
      downloadCSV([headers.join(','), ...rows.map(r => r.join(','))].join('\n'), `DemandIQ_Historical_Sales_${stockCode}.csv`);
    } catch (err) {
      alert('History export failed: ' + err.message);
    }
  };

  const downloadCSV = (content, filename) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + content;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState title="Reports Center" message={error} />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#121720] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Executive Reports & Data Downloads
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Export structured CSV datasets for audit, downstream analytics, and executive demand reviews.
        </p>
      </div>

      {exportSuccessMsg && (
        <div className="p-4 rounded-2xl bg-[#dff5ec] dark:bg-[#112c22] border border-[#c4eedb] text-[#065f46] dark:text-[#34d399] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {/* Report 1: Custom Forecast CSV Generator */}
      <div className="bg-white dark:bg-[#121720] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wider">
            Report #1: Custom Multi-Day Forecast Export
          </span>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
            Simulate and Download Forward Demand Series
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Product SKU</label>
            <select
              value={exportProduct}
              onChange={(e) => setExportProduct(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#10b981]"
            >
              {products.map((p) => (
                <option key={p.stock_code} value={p.stock_code}>
                  {p.stock_code} – {p.description}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ML Model</label>
            <select
              value={exportModel}
              onChange={(e) => setExportModel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#10b981]"
            >
              <option value="CatBoost">CatBoost (Lowest MAE)</option>
              <option value="XGBoost">XGBoost</option>
              <option value="Random Forest">Random Forest (Lowest RMSE)</option>
              <option value="Linear Regression">Linear Regression</option>
              <option value="Decision Tree">Decision Tree</option>
              <option value="KNN">KNN</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Horizon</label>
            <select
              value={exportHorizon}
              onChange={(e) => setExportHorizon(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#10b981]"
            >
              <option value={7}>7 Days (Weekly)</option>
              <option value={14}>14 Days (Bi-weekly)</option>
              <option value={30}>30 Days (Monthly)</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleExportForecast}
            disabled={exportingForecast}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs shadow-md shadow-[#10b981]/25 hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            {exportingForecast ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating & Downloading CSV...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Generate & Download Forecast CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Ready-to-Download Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report 2: Model Benchmark */}
        <div className="rounded-3xl p-6 bg-[#eee8fc] dark:bg-[#23183a] border border-[#dcd0f9] dark:border-[#3d2b63] flex flex-col justify-between h-48">
          <div>
            <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-white/10 text-[#5b21b6] dark:text-[#c4b5fd] flex items-center justify-center mb-2">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Report #2: Model Benchmark Leaderboard
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Complete evaluation scorecard: MAE, RMSE, R² Score, and WAPE (%) across all models.
            </p>
          </div>

          <button
            onClick={handleExportModelMetrics}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#121720] text-slate-900 dark:text-white font-bold text-xs shadow-xs hover:scale-[1.02] transition-all self-start"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Leaderboard CSV</span>
          </button>
        </div>

        {/* Report 3: 30-Product Portfolio Summary */}
        <div className="rounded-3xl p-6 bg-[#dff5ec] dark:bg-[#112c22] border border-[#c4eedb] dark:border-[#1d4d3c] flex flex-col justify-between h-48">
          <div>
            <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-white/10 text-[#065f46] dark:text-[#34d399] flex items-center justify-center mb-2">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Report #3: 30-Product Portfolio Summary
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Catalog master overview: StockCodes, Descriptions, Total Historical Sales, and Avg Prices.
            </p>
          </div>

          <button
            onClick={handleExportProductSummary}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#121720] text-slate-900 dark:text-white font-bold text-xs shadow-xs hover:scale-[1.02] transition-all self-start"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Catalog Summary CSV</span>
          </button>
        </div>
      </div>

      {/* Report 4: Direct SKU Daily Historical Logs */}
      <div className="bg-white dark:bg-[#121720] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Report #4: Direct Product Historical Records CSV
          </h3>
          <p className="text-xs text-slate-400">
            One-click CSV download for daily observations of each SKU
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.slice(0, 12).map((p) => (
            <div
              key={p.stock_code}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#18202c] border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
            >
              <div className="min-w-0">
                <span className="font-mono text-xs font-bold text-[#10b981] block">
                  {p.stock_code}
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium">
                  {p.description}
                </p>
              </div>

              <button
                onClick={() => handleExportProductHistory(p.stock_code)}
                className="p-2 rounded-full bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 shadow-xs hover:scale-105 transition-transform"
                title={`Download CSV for ${p.stock_code}`}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
