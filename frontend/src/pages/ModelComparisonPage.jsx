import React, { useEffect, useState } from 'react';
import {
  Award,
  BarChart3,
  Cpu,
  Layers,
  Sparkles,
  Download,
  CheckCircle,
  Zap,
  TrendingDown,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

import api from '../services/api';
import ErrorState from '../components/ErrorState';
import { TableSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';

export const ModelComparisonPage = () => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMetricTab, setActiveMetricTab] = useState('mae');

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getModelMetrics();
      setMetrics(res);
    } catch (err) {
      console.error('Error fetching model metrics:', err);
      setError('Failed to load model comparison table.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleExportCSV = () => {
    if (!metrics || metrics.length === 0) return;

    const headers = ['Model', 'MAE', 'RMSE', 'R2 Score', 'WAPE (%)'];
    const rows = metrics.map((m) => [
      `"${m.model}"`,
      m.mae,
      m.rmse,
      m.r2_score,
      m.wape,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'DemandIQ_Model_Comparison_Benchmark.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton height="h-72" />
        <TableSkeleton rows={7} />
      </div>
    );
  }

  if (error || metrics.length === 0) {
    return (
      <ErrorState
        title="Model Benchmark Unavailable"
        message={error || 'Could not load benchmark metrics.'}
        onRetry={loadMetrics}
      />
    );
  }

  const bestMAE = [...metrics].sort((a, b) => a.mae - b.mae)[0];
  const bestRMSE = [...metrics].sort((a, b) => a.rmse - b.rmse)[0];
  const bestR2 = [...metrics].sort((a, b) => b.r2_score - a.r2_score)[0];
  const bestWAPE = [...metrics].sort((a, b) => a.wape - b.wape)[0];

  const metricTabs = [
    {
      id: 'mae',
      label: 'MAE',
      fullName: 'Mean Absolute Error',
      description: 'Average magnitude of errors in daily units. Lower is better.',
      unit: 'units/day',
      bestModel: bestMAE?.model,
      bestValue: bestMAE?.mae,
      lowerIsBetter: true,
      color: '#10b981', // Mint
    },
    {
      id: 'rmse',
      label: 'RMSE',
      fullName: 'Root Mean Squared Error',
      description: 'Penalizes large outlier forecast errors heavily. Lower is better.',
      unit: '',
      bestModel: bestRMSE?.model,
      bestValue: bestRMSE?.rmse,
      lowerIsBetter: true,
      color: '#8b5cf6', // Lavender
    },
    {
      id: 'r2_score',
      label: 'R² Score',
      fullName: 'Variance Explained',
      description: 'Proportion of demand variance explained by the model. Higher is better.',
      unit: '',
      bestModel: bestR2?.model,
      bestValue: bestR2?.r2_score,
      lowerIsBetter: false,
      color: '#3b82f6', // Aqua / Blue
    },
    {
      id: 'wape',
      label: 'WAPE (%)',
      fullName: 'Weighted Absolute % Error',
      description: 'Error as a percentage of total demand volume. Lower is better.',
      unit: '%',
      bestModel: bestWAPE?.model,
      bestValue: bestWAPE?.wape,
      lowerIsBetter: true,
      color: '#f59e0b', // Yellow
    },
  ];

  const currentTab = metricTabs.find(t => t.id === activeMetricTab) || metricTabs[0];

  const chartData = [...metrics].sort((a, b) => {
    if (currentTab.lowerIsBetter) {
      return a[activeMetricTab] - b[activeMetricTab];
    }
    return b[activeMetricTab] - a[activeMetricTab];
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#121720] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Machine Learning Model Comparison
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Empirical benchmark leaderboard computed on the chronological 20% test split.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Metrics CSV</span>
        </button>
      </div>

      {/* Pastel Highlight Cards matching Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mint Card */}
        <div className="rounded-3xl p-5 bg-[#dff5ec] dark:bg-[#112c22] border border-[#c4eedb] dark:border-[#1d4d3c] flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#065f46] dark:text-[#34d399] uppercase tracking-wider">
              Lowest MAE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-white/10 text-[#065f46] dark:text-[#34d399] text-[10px] font-extrabold">
              Top Accuracy
            </span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{bestMAE?.model}</h3>
            <p className="text-2xl font-mono font-extrabold text-[#065f46] dark:text-[#34d399] mt-0.5">
              {bestMAE?.mae} <span className="text-xs font-normal text-slate-500">units/day</span>
            </p>
          </div>
        </div>

        {/* Lavender Card */}
        <div className="rounded-3xl p-5 bg-[#eee8fc] dark:bg-[#23183a] border border-[#dcd0f9] dark:border-[#3d2b63] flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5b21b6] dark:text-[#c4b5fd] uppercase tracking-wider">
              Lowest RMSE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-white/10 text-[#5b21b6] dark:text-[#c4b5fd] text-[10px] font-extrabold">
              Outlier Proof
            </span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{bestRMSE?.model}</h3>
            <p className="text-2xl font-mono font-extrabold text-[#5b21b6] dark:text-[#c4b5fd] mt-0.5">
              {bestRMSE?.rmse}
            </p>
          </div>
        </div>

        {/* Aqua Card */}
        <div className="rounded-3xl p-5 bg-[#daf5f7] dark:bg-[#0d272d] border border-[#b9eef2] dark:border-[#15424c] flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#155e75] dark:text-[#67e8f9] uppercase tracking-wider">
              Highest R² Score
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-white/10 text-[#155e75] dark:text-[#67e8f9] text-[10px] font-extrabold">
              Best Fit
            </span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{bestR2?.model}</h3>
            <p className="text-2xl font-mono font-extrabold text-[#155e75] dark:text-[#67e8f9] mt-0.5">
              {bestR2?.r2_score}
            </p>
          </div>
        </div>

        {/* Yellow Card */}
        <div className="rounded-3xl p-5 bg-[#fff3d6] dark:bg-[#33240e] border border-[#fee4a5] dark:border-[#573c16] flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#92400e] dark:text-[#fde047] uppercase tracking-wider">
              Lowest WAPE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-white/10 text-[#92400e] dark:text-[#fde047] text-[10px] font-extrabold">
              Min % Error
            </span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{bestWAPE?.model}</h3>
            <p className="text-2xl font-mono font-extrabold text-[#92400e] dark:text-[#fde047] mt-0.5">
              {bestWAPE?.wape}%
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Visualizer Card */}
      <div className="bg-white dark:bg-[#121720] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Comparative Benchmark Visualizer
            </h3>
            <p className="text-xs text-slate-400">
              {currentTab.description}
            </p>
          </div>

          {/* Metric Selector Pills */}
          <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            {metricTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMetricTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeMetricTab === tab.id
                    ? 'bg-white dark:bg-[#121720] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 125, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
              <XAxis type="number" stroke="#94a3b8" fontSize={10} />
              <YAxis type="category" dataKey="model" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                  color: '#0f172a',
                }}
                formatter={(val) => [`${Number(val).toFixed(2)} ${currentTab.unit}`, currentTab.fullName]}
              />
              <Bar dataKey={activeMetricTab} radius={[0, 8, 8, 0]}>
                {chartData.map((entry, index) => {
                  const isBest = entry.model === currentTab.bestModel;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isBest ? '#10b981' : '#94a3b8'}
                      opacity={entry.model.includes('Baseline') ? 0.35 : 0.85}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <div className="bg-white dark:bg-[#121720] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Leaderboard Matrix
          </h3>
          <p className="text-xs text-slate-400">
            Empirical out-of-sample testing results from model_comparison.csv
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Model Architecture</th>
                <th className="py-2.5 px-3 text-right">MAE</th>
                <th className="py-2.5 px-3 text-right">RMSE</th>
                <th className="py-2.5 px-3 text-right">R² Score</th>
                <th className="py-2.5 px-3 text-right">WAPE (%)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {metrics.map((row, idx) => {
                const isMAEBest = row.model === bestMAE?.model;
                const isRMSEBest = row.model === bestRMSE?.model;
                const isR2Best = row.model === bestR2?.model;
                const isWAPEBest = row.model === bestWAPE?.model;
                const isBaseline = row.model.includes('Baseline');

                return (
                  <tr key={row.model} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                        idx === 0 ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60' :
                        idx === 1 ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                        idx === 2 ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200/60' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-[#10b981]" />
                      <span>{row.model}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <span className={`px-2 py-0.5 rounded-lg ${isMAEBest ? 'bg-emerald-100 text-emerald-700 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                        {Number(row.mae).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <span className={`px-2 py-0.5 rounded-lg ${isRMSEBest ? 'bg-purple-100 text-purple-700 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                        {Number(row.rmse).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <span className={`px-2 py-0.5 rounded-lg ${isR2Best ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                        {Number(row.r2_score).toFixed(3)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <span className={`px-2 py-0.5 rounded-lg ${isWAPEBest ? 'bg-amber-100 text-amber-700 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                        {Number(row.wape).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isBaseline ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {isBaseline ? 'Baseline' : 'Calibrated'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModelComparisonPage;
