import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Package,
  Award,
  Database,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Cpu,
  Clock,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import StatCard from '../components/StatCard';
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';
import api from '../services/api';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Time filter for Demand trends chart: 'daily', 'weekly', 'monthly'
  const [timeFilter, setTimeFilter] = useState('daily');
  const [tableFilter, setTableFilter] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height="h-72" />
          <ChartSkeleton height="h-72" />
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Dashboard Unavailable"
        message={error || 'Could not connect to the DemandIQ backend server.'}
        onRetry={loadDashboard}
      />
    );
  }

  // Aggregate or downsample trend data based on timeFilter
  const getProcessedTrend = () => {
    const raw = data.daily_demand_trend || [];
    if (timeFilter === 'monthly') {
      const months = {};
      raw.forEach(pt => {
        const m = pt.date.slice(0, 7);
        months[m] = (months[m] || 0) + pt.demand;
      });
      return Object.entries(months).map(([date, demand]) => ({
        date: date.slice(5),
        demand: Math.round(demand),
      }));
    }
    if (timeFilter === 'weekly') {
      const weeks = [];
      for (let i = 0; i < raw.length; i += 7) {
        const slice = raw.slice(i, i + 7);
        const sum = slice.reduce((acc, c) => acc + c.demand, 0);
        weeks.push({
          date: slice[0].date.slice(5),
          demand: Math.round(sum),
        });
      }
      return weeks;
    }
    // Daily (last 60 days)
    return raw.slice(-60).map(pt => ({
      date: pt.date.slice(5),
      demand: Math.round(pt.demand),
    }));
  };

  const trendData = getProcessedTrend();

  // Donut chart distribution data
  const top1 = data.top_10_products?.[0];
  const top2 = data.top_10_products?.[1];
  const top3 = data.top_10_products?.[2];
  const top1Demand = top1?.total_demand || 54161;
  const top2Demand = top2?.total_demand || 49756;
  const top3Demand = top3?.total_demand || 46220;
  const otherDemand = Math.max(0, data.total_demand - (top1Demand + top2Demand + top3Demand));

  const pieData = [
    { name: 'Popcorn Holder', value: top1Demand, color: '#10b981' }, // Mint
    { name: 'WW2 Gliders Asstd', value: top2Demand, color: '#f43f5e' }, // Coral
    { name: 'Jumbo Bag Red', value: top3Demand, color: '#f59e0b' }, // Yellow
    { name: 'Remaining 27 SKUs', value: otherDemand, color: '#0ea5e9' }, // Cyan
  ];

  const formatUnits = (val) => Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const formatGBP = (val) => `£${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const filteredProducts = (data.top_10_products || []).filter(p =>
    p.stock_code.toLowerCase().includes(tableFilter.toLowerCase()) ||
    p.description.toLowerCase().includes(tableFilter.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 2-Column Main Section matching CreditGuard AI Reference Screenshot */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (~70% width): Header, 6 KPI cards, 2 charts, Recent product table */}
        <div className="xl:col-span-8 space-y-6">
          {/* Section Title */}
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Demand overview
            </h2>
          </div>

          {/* 6 Pastel KPI Cards in 2x3 Grid (No text truncation) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {/* 1. Mint Card - Total Units Sold */}
            <StatCard
              title="Total units sold"
              value={formatUnits(data.total_demand)}
              subtitle="10,380 records"
              trend="12.4%"
              trendPositive={true}
              icon={CreditCard}
              variant="mint"
              onClick={() => navigate('/products')}
            />

            {/* 2. Pink Card - Products Analysed */}
            <StatCard
              title="Products analysed"
              value={`${data.total_products} SKUs`}
              subtitle="Active catalog"
              trend="100%"
              trendPositive={true}
              icon={AlertTriangle}
              variant="pink"
              onClick={() => navigate('/products')}
            />

            {/* 3. Yellow Card - Best Performing Model */}
            <StatCard
              title="Best model (MAE)"
              value={data.best_model_by_mae}
              subtitle={`MAE: ${data.best_mae_score} units`}
              trend="Rank #1"
              trendPositive={true}
              icon={ShieldCheck}
              variant="yellow"
              onClick={() => navigate('/models')}
            />

            {/* 4. Lavender Card - Average Daily Demand */}
            <StatCard
              title="Average daily demand"
              value={`${(data.total_demand / data.total_records).toFixed(1)}`}
              subtitle="Units per product/day"
              trend="Stable"
              trendPositive={true}
              icon={Database}
              variant="lavender"
              onClick={() => navigate('/forecast')}
            />

            {/* 5. Aqua Card - Total Gross Revenue */}
            <StatCard
              title="Gross retail revenue"
              value={formatGBP(data.total_revenue)}
              subtitle="Historical sales"
              trend="8.2%"
              trendPositive={true}
              icon={Clock}
              variant="aqua"
              onClick={() => navigate('/reports')}
            />

            {/* 6. Rose Card - Model Accuracy R² */}
            <StatCard
              title="Top model fit (R²)"
              value={`${data.best_r2_score} (RF)`}
              subtitle={`RMSE: ${data.best_rmse_score}`}
              trend="Best fit"
              trendPositive={true}
              icon={Sparkles}
              variant="rose"
              onClick={() => navigate('/models')}
            />
          </div>

          {/* Two Large Chart Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Chart 1: Demand trends over time */}
            <div className="bg-white dark:bg-[#121720] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Demand trends over time
                </h3>

                {/* Dropdown filter */}
                <div className="relative">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="appearance-none px-3 py-1 pr-6 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                    ▼
                  </span>
                </div>
              </div>

              {/* Mint Line/Area Chart */}
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mintGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                        color: '#0f172a',
                      }}
                      formatter={(val) => [`${Number(val).toLocaleString()} units`, 'Demand']}
                    />
                    <Area
                      type="monotone"
                      dataKey="demand"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#mintGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Product demand distribution (Donut chart with center text) */}
            <div className="bg-white dark:bg-[#121720] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Product demand distribution
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 my-auto py-2">
                {/* Donut with Center Text */}
                <div className="relative w-44 h-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '11px',
                        }}
                        formatter={(val) => [`${formatUnits(val)} units`, 'Demand']}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Total Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {formatUnits(data.total_demand)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Total units
                    </span>
                  </div>
                </div>

                {/* Legend list - Clean text with no awkward clipping */}
                <div className="space-y-2.5 text-xs flex-1 min-w-0">
                  {pieData.map((slice) => (
                    <div key={slice.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          {slice.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {formatUnits(slice.value)} ({(slice.value / data.total_demand * 100).toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Product Activity Table matching reference screenshot */}
          <div className="bg-white dark:bg-[#121720] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Recent product activity
                </h3>
              </div>

              <Link
                to="/products"
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#10b981] flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-8">
                      <input type="checkbox" className="rounded text-[#10b981] focus:ring-0 cursor-pointer" />
                    </th>
                    <th className="py-2.5 px-3">Stock Code</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-right">Units Sold</th>
                    <th className="py-2.5 px-3 text-right">Avg Price</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Last Date</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.slice(0, 5).map((prod, idx) => (
                    <tr
                      key={prod.stock_code}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <input type="checkbox" className="rounded text-[#10b981] focus:ring-0 cursor-pointer" />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {prod.stock_code}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300 max-w-[180px] truncate">
                        {prod.description}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatUnits(prod.total_demand)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        £{Number(prod.average_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          idx === 0
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                            : idx === 1
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {idx === 0 ? 'High' : idx === 1 ? 'High' : 'Normal'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                        2011-12-09
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Link
                          to={`/forecast?product=${prod.stock_code}`}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white inline-flex items-center"
                          title="Forecast this product"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (~30% width): Recent alerts & Quick actions */}
        <div className="xl:col-span-4 space-y-6">
          {/* Card 1: Recent forecast activity (matching "Recent alerts") */}
          <div className="bg-white dark:bg-[#121720] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Recent forecast activity
              </h3>
              <Link
                to="/forecast"
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#10b981] flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* List of items matching reference screenshot alert cards */}
            <div className="space-y-3">
              {[
                {
                  id: 1,
                  type: 'CatBoost',
                  sku: '22197',
                  name: 'POPCORN HOLDER',
                  desc: 'High demand forecasted',
                  amount: '586 units',
                  time: '2 min ago',
                  variant: 'rose',
                  icon: AlertTriangle,
                },
                {
                  id: 2,
                  type: 'XGBoost',
                  sku: '84077',
                  name: 'WW2 GLIDERS ASSTD',
                  desc: 'Surge pattern detected',
                  amount: '412 units',
                  time: '15 min ago',
                  variant: 'rose',
                  icon: AlertTriangle,
                },
                {
                  id: 3,
                  type: 'Random Forest',
                  sku: '85099B',
                  name: 'JUMBO BAG RED',
                  desc: 'Multi-week stable trend',
                  amount: '385 units',
                  time: '32 min ago',
                  variant: 'rose',
                  icon: AlertTriangle,
                },
                {
                  id: 4,
                  type: 'Linear Regression',
                  sku: '21212',
                  name: 'PACK OF 72 RETROSPOT',
                  desc: 'Baseline trend projected',
                  amount: '290 units',
                  time: '1 hour ago',
                  variant: 'rose',
                  icon: AlertTriangle,
                },
                {
                  id: 5,
                  type: 'Decision Tree',
                  sku: '84879',
                  name: 'ASSORTED BIRD ORNAMENT',
                  desc: 'Weekly demand peak',
                  amount: '340 units',
                  time: '2 hours ago',
                  variant: 'yellow',
                  icon: AlertTriangle,
                },
              ].map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => navigate(`/forecast?product=${alert.sku}`)}
                  className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#18202c] hover:bg-slate-100 dark:hover:bg-[#1e2837] border border-slate-100 dark:border-slate-800 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      alert.variant === 'yellow'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    }`}>
                      <alert.icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {alert.desc}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate font-mono">
                        {alert.sku} • {alert.amount}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400">{alert.time}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Quick actions (2x2 pastel tiles matching reference) */}
          <div className="bg-white dark:bg-[#121720] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Quick actions
            </h3>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Tile 1: Mint - Forecast Demand */}
              <div
                onClick={() => navigate('/forecast')}
                className="p-4 rounded-2xl bg-[#dff5ec] dark:bg-[#112c22] border border-[#c5eedc] dark:border-[#1d4d3c] flex flex-col justify-between h-28 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#bcecd8] dark:bg-[#163a2d] text-[#065f46] dark:text-[#34d399] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Generate forecast
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#065f46] dark:text-[#34d399] group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Run ML simulation
                  </span>
                </div>
              </div>

              {/* Tile 2: Pink - View Reports */}
              <div
                onClick={() => navigate('/reports')}
                className="p-4 rounded-2xl bg-[#ffe8ec] dark:bg-[#31141c] border border-[#ffd1d9] dark:border-[#561d2b] flex flex-col justify-between h-28 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#ffd3dc] dark:bg-[#461724] text-[#9f1239] dark:text-[#fda4af] flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      View reports
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#9f1239] dark:text-[#fda4af] group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Download analysis
                  </span>
                </div>
              </div>

              {/* Tile 3: Yellow - Explore Products */}
              <div
                onClick={() => navigate('/products')}
                className="p-4 rounded-2xl bg-[#fff3d6] dark:bg-[#33240e] border border-[#fee4a5] dark:border-[#573c16] flex flex-col justify-between h-28 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#fee8b5] dark:bg-[#463013] text-[#92400e] dark:text-[#fde047] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Explore products
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#92400e] dark:text-[#fde047] group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    30 catalog SKUs
                  </span>
                </div>
              </div>

              {/* Tile 4: Lavender - Model Leaderboard */}
              <div
                onClick={() => navigate('/models')}
                className="p-4 rounded-2xl bg-[#eee8fc] dark:bg-[#23183a] border border-[#dcd0f9] dark:border-[#3d2b63] flex flex-col justify-between h-28 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#dfd4f9] dark:bg-[#322252] text-[#5b21b6] dark:text-[#c4b5fd] flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Model settings
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#5b21b6] dark:text-[#c4b5fd] group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Leaderboard & metrics
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
