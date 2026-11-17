import React from 'react';
import { PackageOpen } from 'lucide-react';

export const EmptyState = ({
  title = 'No records found',
  description = 'Try adjusting your filters or search query to view analytics data.',
  action,
}) => {
  return (
    <div className="bg-[#131b2e] light:bg-white rounded-2xl p-10 border border-slate-800/80 light:border-slate-200 text-center max-w-md mx-auto my-6">
      <div className="w-12 h-12 rounded-2xl bg-slate-800/60 light:bg-slate-100 text-slate-400 light:text-slate-500 mx-auto flex items-center justify-center mb-4">
        <PackageOpen className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-white light:text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 light:text-slate-600 mb-4">{description}</p>
      {action}
    </div>
  );
};

export default EmptyState;
