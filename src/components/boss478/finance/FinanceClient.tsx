'use client';

import { useState, useEffect, useCallback, Component, type ReactNode } from 'react';
import FinanceSummary from './FinanceSummary';
import TransactionList from './TransactionList';
import SubscriptionList from './SubscriptionList';
import { CONFIG } from '@/lib/config';

const { MONTHLY_NORMALIZER } = CONFIG.FINANCE;

class FinanceErrorBoundary extends Component<
  { children: ReactNode; tabName: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; tabName: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error(`[Finance:${this.props.tabName}]`, error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 rounded-xl border border-red-200/60 dark:border-red-700/50 bg-red-50/60 dark:bg-red-900/30 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">Something went wrong in {this.props.tabName}</p>
          <p className="text-xs text-zinc-400 mt-1">Try refreshing the page</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const TABS = [
  { id: 'overview' as const, label: 'Overview', icon: 'fi-sr-apps' },
  { id: 'transactions' as const, label: 'Transactions', icon: 'fi-sr-list' },
  { id: 'subscriptions' as const, label: 'Subscriptions', icon: 'fi-sr-repeat' },
];

export default function FinanceClient() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [summaryData, setSummaryData] = useState<{
    incomeTotal: number;
    expenseTotal: number;
    subscriptionTotal: number;
    balance: number;
    month: string;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const [txRes, subRes] = await Promise.all([
        fetch(`/boss478/finance/api/transactions?month=${month}`),
        fetch('/boss478/finance/api/subscriptions'),
      ]);

      if (!txRes.ok || !subRes.ok) throw new Error('Failed to fetch summary');

      const { transactions } = await txRes.json();
      const { subscriptions } = await subRes.json();

      const incomeTotal = transactions
        .filter((t: { type: string }) => t.type === 'income')
        .reduce((s: number, t: { amount: number }) => s + t.amount, 0);

      const expenseTotal = transactions
        .filter((t: { type: string }) => t.type === 'expense')
        .reduce((s: number, t: { amount: number }) => s + t.amount, 0);

      const subscriptionTotal = subscriptions
        .filter((s: { active: boolean }) => s.active)
        .reduce((sum: number, s: { amount: number; billingCycle: string }) => {
          const norm = MONTHLY_NORMALIZER[s.billingCycle as keyof typeof MONTHLY_NORMALIZER] || 1;
          return sum + s.amount * norm;
        }, 0);

      setSummaryData({
        incomeTotal,
        expenseTotal,
        subscriptionTotal,
        balance: incomeTotal - expenseTotal - subscriptionTotal,
        month,
      });
    } catch {
      setSummaryError('Could not load summary');
    } finally {
      setSummaryLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, refreshKey]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
      <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-3">
        <i className="fi fi-sr-wallet text-emerald-500" />
        Budget Tracker
      </h1>

      <div className="hidden md:flex items-center gap-1 mb-6 p-1 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <i className={`fi ${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="md:hidden flex gap-1 mb-4 p-1 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              onClick={() => { setRefreshKey((k) => k + 1); }}
              className="p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
            >
              <i className="fi fi-sr-rotate-left text-xs text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          <FinanceSummary
            data={summaryData}
            loading={summaryLoading}
            error={summaryError}
          />
        </div>
      )}

      {activeTab === 'transactions' && (
        <FinanceErrorBoundary tabName="Transactions">
          <TransactionList refreshKey={refreshKey} />
        </FinanceErrorBoundary>
      )}

      {activeTab === 'subscriptions' && (
        <FinanceErrorBoundary tabName="Subscriptions">
          <SubscriptionList refreshKey={refreshKey} />
        </FinanceErrorBoundary>
      )}
    </div>
  );
}
