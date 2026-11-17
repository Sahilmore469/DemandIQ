import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart2,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import api from '../services/api';
import ErrorState from '../components/ErrorState';
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '../components/LoadingSkeleton';

export const ProductAnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const queryProduct = searchParams.get('product');

  const [products, setProducts] = useState([]);
  const [selectedStockCode, setSelectedStockCode] = useState('');
  const [productDetail, setProductDetail] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);

  // Table pagination & search
  const [searchFilter, setSearchFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let isMounted = true;
    api.getProducts()
      .then((list) => {
        if (!isMounted) return;
        setProducts(list);
        if (queryProduct && list.some(p => p.stock_code === queryProduct)) {
          setSelectedStockCode(queryProduct);
        } else if (list.length > 0) {
          setSelectedStockCode(list[0].stock_code);
        }
      })
      .catch((err) => {
        if (isMounted) setError('Failed to load products catalog.');
      })
      .finally(() => {
        if (isMounted) setLoadingList(false);
      });

    return () => {
      isMounted = false;
    };
  }, [queryProduct]);

  useEffect(() => {
    if (!selectedStockCode) return;

    let isMounted = true;
    const fetchDetails = async () => {
      try {
        setLoadingDetail(true);
        setError(null);
        const [detailRes, histRes] = await Promise.all([
          api.getProductDetail(selectedStockCode),
          api.getProductHistory(selectedStockCode),
        ]);

        if (!isMounted) return;
        setProductDetail(detailRes);
        setHistoryRecords(histRes);
        setPage(1);
      } catch (err) {
        if (isMounted) setError('Failed to load product analytics.');
      } finally {
        if (isMounted) setLoadingDetail(false);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [selectedStockCode]);

  if (loadingList) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <ChartSkeleton height="h-80" />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  const filteredRecords = historyRecords.filter(r =>
    r.date.includes(searchFilter) ||
    String(r.daily_demand).includes(searchFilter)
  );

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  const formatUnits = (val) => Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const formatGBP = (val) => `£${Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Product Selector Header Card */}
      <div className="bg-white dark:bg-[#121720] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Product Analytics & Seasonality
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deep-dive into individual product velocity, moving averages, and temporal patterns.
          </p>
        </div>

        <div className="w-full md:w-80">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Selected Product
          </label>
          <select
            value={selectedStockCode}
            onChange={(e) => setSelectedStockCode(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#10b981]"
          >
            {products.map((p) => (
              <option key={p.stock_code} value={p.stock_code}>
                {p.stock_code} – {p.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingDetail && (
        <div className="space-y-6">
          <CardSkeleton />
          <ChartSkeleton height="h-80" />
        </div>
      )}

      {error && !loadingDetail && (
        <ErrorState
          title="Product Error"
          message={error}
          onRetry={() => setSelectedStockCode(selectedStockCode)}
        />
      )}

      {productDetail && !loadingDetail && (
        <div className="space-y-6">
          {/* Pastel Product KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl p-5 bg-[#dff5ec] dark:bg-[#112c22] border border-[#c4eedb] dark:border-[#1d4d3c]">
              <span className="text-xs font-semibold text-[#065f46] dark:text-[#34d399] uppercase tracking-wider">
                Total Units Sold
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatUnits(productDetail.total_demand)} <span className="text-xs font-normal text-slate-500">units</span>
              </div>
              <p className="text-[11px] text-[#065f46] dark:text-[#34d399] font-medium mt-1">All 346 observed days</p>
            </div>

            <div className="rounded-3xl p-5 bg-[#ffe8ec] dark:bg-[#31141c] border border-[#ffd1d9] dark:border-[#561d2b]">
              <span className="text-xs font-semibold text-[#9f1239] dark:text-[#fda4af] uppercase tracking-wider">
                Gross Sales Revenue
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatGBP(productDetail.total_revenue)}
              </div>
              <p className="text-[11px] text-[#9f1239] dark:text-[#fda4af] font-medium mt-1">Aggregate retail volume</p>
            </div>

            <div className="rounded-3xl p-5 bg-[#fff3d6] dark:bg-[#33240e] border border-[#fee4a5] dark:border-[#573c16]">
              <span className="text-xs font-semibold text-[#92400e] dark:text-[#fde047] uppercase tracking-wider">
                Average Selling Price
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatGBP(productDetail.average_price)}
              </div>
              <p className="text-[11px] text-[#92400e] dark:text-[#fde047] font-medium mt-1">Unit transaction avg</p>
            </div>

            <div className="rounded-3xl p-5 bg-[#eee8fc] dark:bg-[#23183a] border border-[#dcd0f9] dark:border-[#3d2b63] flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-[#5b21b6] dark:text-[#c4b5fd] uppercase tracking-wider">
                  Forecast SKU
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                  {productDetail.description}
                </p>
              </div>
              <Link
                to={`/forecast?product=${productDetail.stock_code}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 mt-2 rounded-full bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs shadow-sm transition-colors"
              >
                <span>Run Forecast</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Test Evaluation Card */}
          {productDetail.evaluation_metrics && (
            <div className="rounded-3xl p-5 sm:p-6 bg-slate-50 dark:bg-[#18202c] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wider">
                  Test Split Evaluation (XGBoost)
                </span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  Out-of-sample metrics on the final 20% chronological split
                </h4>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-white dark:bg-[#121720] border border-slate-200 dark:border-slate-700 font-medium">
                  MAE: <strong className="text-[#10b981]">{productDetail.evaluation_metrics.mae} units</strong>
                </span>
                <span className="px-3 py-1 rounded-full bg-white dark:bg-[#121720] border border-slate-200 dark:border-slate-700 font-medium">
                  RMSE: <strong className="text-purple-500">{productDetail.evaluation_metrics.rmse}</strong>
                </span>
                <span className="px-3 py-1 rounded-full bg-white dark:bg-[#121720] border border-slate-200 dark:border-slate-700 font-medium">
                  WAPE: <strong className="text-blue-500">{productDetail.evaluation_metrics.wape}%</strong>
                </span>
              </div>
            </div>
          )}

          {/* Historical Demand & Moving Averages Chart */}
          <div className="bg-white dark:bg-[#121720] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Historical Demand & Moving Averages
              </h3>
              <p className="text-xs text-slate-400">
                Daily actual demand overlaid with 7-day and 28-day rolling moving averages
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    }}
                    formatter={(val, name) => [
                      `${Number(val).toFixed(1)} units`,
                      name === 'daily_demand' ? 'Daily Actual' : name === 'rolling_mean_7' ? '7d Rolling' : '28d Rolling'
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(val) => (
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1">
                        {val === 'daily_demand' ? 'Daily Demand' : val === 'rolling_mean_7' ? '7-Day Rolling' : '28-Day Rolling'}
                      </span>
                    )}
                  />
                  <Line type="monotone" dataKey="daily_demand" stroke="#cbd5e1" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="rolling_mean_7" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="rolling_mean_28" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Seasonality: Weekly & Monthly Patterns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#121720] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Weekly Seasonality (Mon – Sun)
                </h3>
                <p className="text-xs text-slate-400">
                  Average daily units sold by day of the week
                </p>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productDetail.weekly_pattern} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                    <XAxis dataKey="day_name" stroke="#94a3b8" fontSize={10} tickFormatter={(d) => d.slice(0, 3)} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px',
                      }}
                      formatter={(val) => [`${val} units/day`, 'Avg Demand']}
                    />
                    <Bar dataKey="average_demand" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-[#121720] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Monthly Seasonality (Jan – Dec)
                </h3>
                <p className="text-xs text-slate-400">
                  Average daily units sold across months
                </p>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productDetail.monthly_pattern} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                    <XAxis dataKey="month_name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px',
                      }}
                      formatter={(val) => [`${val} units/day`, 'Avg Demand']}
                    />
                    <Bar dataKey="average_demand" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white dark:bg-[#121720] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Historical Log for {productDetail.stock_code}
                </h3>
                <p className="text-xs text-slate-400">{historyRecords.length} daily observations</p>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by date..."
                  value={searchFilter}
                  onChange={(e) => {
                    setSearchFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Daily Demand</th>
                    <th className="py-2.5 px-3 text-right">Daily Revenue</th>
                    <th className="py-2.5 px-3 text-right">Avg Unit Price</th>
                    <th className="py-2.5 px-3 text-right">7d Rolling</th>
                    <th className="py-2.5 px-3 text-right">28d Rolling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {paginatedRecords.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{row.date}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#10b981]">{row.daily_demand.toFixed(0)} units</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">£{row.daily_revenue.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">£{row.average_price.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{row.rolling_mean_7.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{row.rolling_mean_28.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAnalyticsPage;
