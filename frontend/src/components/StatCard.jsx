import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'mint', // 'mint', 'pink', 'yellow', 'lavender', 'aqua', 'rose'
  trend,
  trendPositive = true,
  onClick,
}) => {
  // Pastel styles matching CreditGuard AI reference screenshot
  const variantStyles = {
    mint: {
      card: 'bg-[#dff5ec] dark:bg-[#112c22] border-[#c4eedb] dark:border-[#1d4d3c] text-slate-900 dark:text-white',
      iconBox: 'bg-[#bcecd8] dark:bg-[#163a2d] text-[#065f46] dark:text-[#34d399]',
      btn: 'bg-white/90 dark:bg-white/10 text-[#065f46] dark:text-[#34d399]',
      sub: 'text-[#065f46] dark:text-[#6ee7b7]',
    },
    pink: {
      card: 'bg-[#ffe8ec] dark:bg-[#31141c] border-[#ffd1d9] dark:border-[#561d2b] text-slate-900 dark:text-white',
      iconBox: 'bg-[#ffd3dc] dark:bg-[#461724] text-[#9f1239] dark:text-[#fda4af]',
      btn: 'bg-white/90 dark:bg-white/10 text-[#9f1239] dark:text-[#fda4af]',
      sub: 'text-[#9f1239] dark:text-[#fca5a5]',
    },
    yellow: {
      card: 'bg-[#fff3d6] dark:bg-[#33240e] border-[#fee4a5] dark:border-[#573c16] text-slate-900 dark:text-white',
      iconBox: 'bg-[#fee8b5] dark:bg-[#463013] text-[#92400e] dark:text-[#fde047]',
      btn: 'bg-white/90 dark:bg-white/10 text-[#92400e] dark:text-[#fde047]',
      sub: 'text-[#92400e] dark:text-[#fde047]',
    },
    lavender: {
      card: 'bg-[#eee8fc] dark:bg-[#23183a] border-[#dcd0f9] dark:border-[#3d2b63] text-slate-900 dark:text-white',
      iconBox: 'bg-[#dfd4f9] dark:bg-[#322252] text-[#5b21b6] dark:text-[#c4b5fd]',
      btn: 'bg-white/90 dark:bg-white/10 text-[#5b21b6] dark:text-[#c4b5fd]',
      sub: 'text-[#5b21b6] dark:text-[#c4b5fd]',
    },
    aqua: {
      card: 'bg-[#daf5f7] dark:bg-[#0d272d] border-[#b9eef2] dark:border-[#15424c] text-slate-900 dark:text-white',
      iconBox: 'bg-[#bee8ec] dark:bg-[#12363e] text-[#155e75] dark:text-[#67e8f9]',
      btn: 'bg-white/90 dark:bg-white/10 text-[#155e75] dark:text-[#67e8f9]',
      sub: 'text-[#155e75] dark:text-[#67e8f9]',
    },
    rose: {
      card: 'bg-[#ffe8e4] dark:bg-[#331812] border-[#ffd4cc] dark:border-[#56271c] text-slate-900 dark:text-white',
      iconBox: 'bg-[#ffd3cb] dark:bg-[#481f17] text-[#9a3412] dark:text-[#fdba74]',
      btn: 'bg-white/90 dark:bg-white/10 text-[#9a3412] dark:text-[#fdba74]',
      sub: 'text-[#9a3412] dark:text-[#fdba74]',
    },
  };

  const current = variantStyles[variant] || variantStyles.mint;

  return (
    <div
      onClick={onClick}
      className={`rounded-3xl p-4 sm:p-5 border ${current.card} shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 relative cursor-pointer group`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Icon in Rounded Box */}
        {Icon && (
          <div className={`w-11 h-11 rounded-2xl ${current.iconBox} flex items-center justify-center shrink-0 shadow-xs`}>
            <Icon className="w-5 h-5" />
          </div>
        )}

        {/* Text & Large Numbers - No truncation so values like CatBoost and £972,945 display cleanly */}
        <div className="space-y-0.5 min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            {value}
          </h3>
          {(subtitle || trend) && (
            <p className={`text-[11px] font-semibold flex items-center gap-1.5 ${current.sub} whitespace-nowrap overflow-hidden text-ellipsis`}>
              {trend && (
                <span>
                  {trendPositive ? '↑' : '↓'} {trend}
                </span>
              )}
              {subtitle && <span>{subtitle}</span>}
            </p>
          )}
        </div>
      </div>

      {/* Small Circular Arrow Button matching reference */}
      <div className={`w-8 h-8 rounded-full ${current.btn} shadow-xs flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </div>
  );
};

export default StatCard;
