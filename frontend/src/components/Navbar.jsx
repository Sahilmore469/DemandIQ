import React from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, Sun, Moon, Menu, Database } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const PAGE_META = {
  '/': {
    title: 'Executive Dashboard',
    subtitle: 'High-level demand overview, catalog volume, and revenue metrics.',
  },
  '/forecast': {
    title: 'Demand Forecasting Engine',
    subtitle: 'Multi-day recursive autoregressive demand simulations across SKUs.',
  },
  '/products': {
    title: 'Product Analytics & Seasonality',
    subtitle: 'Granular SKU velocity, rolling moving averages, and seasonality curves.',
  },
  '/models': {
    title: 'ML Model Benchmarks',
    subtitle: 'Empirical out-of-sample accuracy leaderboard across all 6 architectures.',
  },
  '/reports': {
    title: 'Reports & Export Hub',
    subtitle: 'Structured CSV data downloads for compliance, audits, and downstream BI.',
  },
};

export const Navbar = ({ onOpenSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const currentMeta = PAGE_META[location.pathname] || PAGE_META['/'];

  return (
    <header className="p-6 sm:p-8 pb-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-[#edf4f0] dark:border-[#1e2633]">
      {/* Dynamic Page Heading & Subtitle */}
      <div className="flex items-start gap-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white lg:hidden shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            {currentMeta.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Top Right Controls: Dataset Badge, Period Badge & Theme Toggle all in ONE single line */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-nowrap whitespace-nowrap overflow-x-auto sm:overflow-visible">
        {/* Dataset Name Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-[#161d28] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs select-none shrink-0">
          <Database className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
          <span>Dataset: <strong className="font-extrabold text-slate-900 dark:text-white">UCI Online Retail</strong></span>
        </div>

        {/* Dataset Period Badge - Fixed badge indicating this dashboard covers these dates */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-[#161d28] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs select-none shrink-0">
          <Calendar className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
          <span>Dec 29, 2010 – Dec 09, 2011</span>
        </div>

        {/* Light / Dark Mode Toggle Switch */}
        <button
          onClick={toggleTheme}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all shadow-xs cursor-pointer shrink-0"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
