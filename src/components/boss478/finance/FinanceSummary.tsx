'use client';

import { CONFIG } from '@/lib/config';

const { MONTHLY_NORMALIZER } = CONFIG.FINANCE;

interface SummaryData {
  incomeTotal: number;
  expenseTotal: number;
  subscriptionTotal: number;
  balance: number;
  month: string;
}

interface Props {
  data: SummaryData | null;
  loading: boolean;
  error: string | null;
}

export default function FinanceSummary({ data, loading, error }: Props) {
  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/40 dark:bg-slate-800/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 px-4 py-3 rounded-lg bg-red-50/80 dark:bg-red-900/30 border border-red-200/60 dark:border-red-700/50 text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mb-6 px-4 py-8 text-center text-zinc-400 dark:text-zinc-500 text-sm rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/60 dark:border-slate-700/50">
        No data for this month
      </div>
    );
  }

  const cards = [
    { label: 'Income', value: data.incomeTotal, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/60 dark:bg-emerald-900/30', icon: 'fi-sr-trend-up' },
    { label: 'Expenses', value: data.expenseTotal, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50/60 dark:bg-red-900/30', icon: 'fi-sr-shopping-cart' },
    { label: 'Subscriptions', value: data.subscriptionTotal, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/60 dark:bg-amber-900/30', icon: 'fi-sr-repeat' },
    { label: 'Balance', value: data.balance, color: data.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400', bg: 'bg-blue-50/60 dark:bg-blue-900/30', icon: 'fi-sr-coins' },
  ];

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} rounded-xl p-4 border border-white/60 dark:border-slate-700/50 backdrop-blur-sm`}
        >
          <div className="flex items-center gap-2 mb-1">
            <i className={`fi ${card.icon} text-xs ${card.color}`} />
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {card.label}
            </span>
          </div>
          <p className={`text-xl font-bold ${card.color}`}>
            ฿{fmt(card.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
