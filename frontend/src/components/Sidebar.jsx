import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  BarChart2,
  FileSpreadsheet,
  Settings,
  Sparkles,
  X
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/forecast', label: 'Demand Forecasting', icon: TrendingUp },
  { path: '/products', label: 'Product Analytics', icon: Package },
  { path: '/models', label: 'Model Comparison', icon: BarChart2 },
  { path: '/reports', label: 'Reports', icon: FileSpreadsheet },
];

export const Sidebar = ({ isOpen, onClose, onOpenSettings }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-60 bg-white dark:bg-[#121720] border-r border-[#e5efe9] dark:border-[#1e2633] flex flex-col justify-between py-6 px-4 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } shrink-0`}
      >
        <div className="space-y-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              {/* Reference Logo Mark: Bold black circular badge */}
              <div className="w-10 h-10 rounded-full bg-slate-950 dark:bg-slate-100 flex items-center justify-center text-white dark:text-slate-950 shadow-sm">
                <span className="font-extrabold text-lg tracking-tighter flex items-center">
                  D<span className="text-[#10b981] font-black text-xl leading-none">.</span>
                </span>
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                  DemandIQ <span className="text-[10px] font-bold text-[#10b981] ml-0.5">AI</span>
                </h1>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  Demand Intelligence
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#dff5ec] text-[#065f46] dark:bg-[#163327] dark:text-[#34d399] shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Settings button at bottom matching reference screenshot */}
        <div className="pt-4 border-t border-[#edf4f0] dark:border-[#1e2633]">
          <button
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              if (onClose) onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/40 transition-all"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
