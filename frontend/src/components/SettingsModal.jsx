import React, { useEffect, useState } from 'react';
import { X, Cpu, Database, Server, CheckCircle2, Sliders } from 'lucide-react';
import api from '../services/api';

export const SettingsModal = ({ isOpen, onClose }) => {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    if (isOpen) {
      api.getHealth()
        .then(setHealth)
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#141a24] rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#dff5ec] dark:bg-[#163327] text-[#065f46] dark:text-[#34d399]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">DemandIQ Platform Settings</h3>
              <p className="text-xs text-slate-500">Pipeline configuration and ML service runtime</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1a2230] border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#10b981]" />
                <span>Backend Engine</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                {health?.status || 'Online'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
              <div>API Version: <span className="font-mono text-slate-900 dark:text-white">v1.0.0</span></div>
              <div>Port: <span className="font-mono text-slate-900 dark:text-white">8000</span></div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1a2230] border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-500" />
                <span>Pre-Trained Machine Learning Models</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {health?.models_count || 6} / 6 Active
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['CatBoost', 'XGBoost', 'Random Forest', 'Linear Regression', 'Decision Tree', 'KNN'].map((m) => (
                <span
                  key={m}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#121720] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1a2230] border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                <span>Processed Dataset Catalog</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                10,380 Records
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              UCI Online Retail transaction corpus. 30 tracked products with calendar, price, and autoregressive lag/rolling features.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
