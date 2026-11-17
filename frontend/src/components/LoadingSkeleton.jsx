import React from 'react';

export const CardSkeleton = () => (
  <div className="rounded-3xl p-5 bg-slate-100 dark:bg-[#18202c] animate-pulse h-28 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700"></div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
        <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
      </div>
    </div>
    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
  </div>
);

export const ChartSkeleton = ({ height = 'h-72' }) => (
  <div className={`rounded-3xl p-6 bg-white dark:bg-[#141a24] border border-slate-100 dark:border-slate-800 ${height} flex flex-col justify-between animate-pulse shadow-sm`}>
    <div className="flex items-center justify-between">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-36"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
    </div>
    <div className="flex items-end gap-2 h-44 pt-4">
      {[35, 60, 45, 80, 50, 90, 70, 55, 95, 60, 75, 85].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t"
          style={{ height: `${h}%` }}
        ></div>
      ))}
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="rounded-3xl p-6 bg-white dark:bg-[#141a24] border border-slate-100 dark:border-slate-800 animate-pulse shadow-sm space-y-4">
    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-44"></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-100 dark:border-slate-800">
        <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
      </div>
    ))}
  </div>
);
