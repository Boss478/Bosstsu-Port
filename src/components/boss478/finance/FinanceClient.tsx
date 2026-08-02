'use client';

import { useState, useEffect, useMemo, Component, type ReactNode, startTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import FinanceSummary from './FinanceSummary';
import TransactionList from './TransactionList';
import SubscriptionList from './SubscriptionList';
import BudgetList from './BudgetList';
import { CONFIG } from '@/lib/config';
import {
  getCurrentPeriodKey,
  getPreviousPeriodKey,
  getNextPeriodKey,
  formatPeriodLabel,
  getPeriodRange,
  PAY_DAY_KEY,
} from '@/lib/period';
import { useTransactions, useSubscriptions } from '@/hooks/use-finance';
import { financeKeys } from '@/lib/query/keys';

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
          <p className="text-sm text-red-600 dark:text-red-400">
            Something went wrong in {this.props.tabName}
          </p>
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
  { id: 'budgets' as const, label: 'Budgets', icon: 'fi-sr-budget' },
  { id: 'subscriptions' as const, label: 'Subscriptions', icon: 'fi-sr-refresh' },
];

function readPayDay(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PAY_DAY_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return n >= 1 && n <= 31 ? n : null;
}

function writePayDay(payDay: number | null) {
  if (typeof window === 'undefined') return;
  if (payDay === null) {
    localStorage.removeItem(PAY_DAY_KEY);
  } else {
    localStorage.setItem(PAY_DAY_KEY, String(payDay));
  }
}

export default function FinanceClient() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [payDay, setPayDayState] = useState<number | null>(null);
  const [month, setMonth] = useState('');
  const [showPayDayEditor, setShowPayDayEditor] = useState(false);
  const [payDayInput, setPayDayInput] = useState('');

  useEffect(() => {
    const pd = readPayDay();
    startTransition(() => {
      setPayDayState(pd);
      if (pd) {
        setMonth(getCurrentPeriodKey(pd));
      } else {
        setMonth(new Date().toISOString().slice(0, 7));
      }
    });
  }, []);

  function setPayDay(pd: number | null) {
    writePayDay(pd);
    setPayDayState(pd);
    setShowPayDayEditor(false);
    if (pd) {
      setMonth(getCurrentPeriodKey(pd));
    } else {
      setMonth(new Date().toISOString().slice(0, 7));
    }
  }

  const txFilters = useMemo((): Record<string, string> => {
    if (!month) return {};
    if (payDay) {
      const range = getPeriodRange(payDay, month);
      return {
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
      };
    }
    return { month };
  }, [payDay, month]);

  const {
    data: summaryTransactions = [],
    isLoading: txLoading,
    error: txError,
  } = useTransactions(txFilters);
  const { data: subscriptions = [], isLoading: subLoading } = useSubscriptions();
  const summaryLoading = txLoading || subLoading;

  const summaryData = useMemo(() => {
    if (!month) return null;

    const incomeTotal = summaryTransactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);

    const expenseTotal = summaryTransactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    const subscriptionTotal = subscriptions
      .filter((s) => s.active)
      .reduce((sum, s) => {
        const norm = MONTHLY_NORMALIZER[s.billingCycle as keyof typeof MONTHLY_NORMALIZER] || 1;
        return sum + s.amount * norm;
      }, 0);

    const allExpense = expenseTotal + subscriptionTotal;

    return {
      incomeTotal,
      expenseTotal,
      subscriptionTotal,
      allExpense,
      netRemaining: incomeTotal - allExpense,
      month,
    };
  }, [summaryTransactions, subscriptions, month]);

  const goPrev = () => {
    if (payDay) {
      setMonth(getPreviousPeriodKey(payDay, month));
    } else {
      const [y, m] = month.split('-').map(Number);
      const d = new Date(y, m - 2, 1);
      setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
  };

  const goNext = () => {
    if (payDay) {
      setMonth(getNextPeriodKey(payDay, month));
    } else {
      const [y, m] = month.split('-').map(Number);
      const d = new Date(y, m, 1);
      setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
      <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-3">
        <i aria-hidden="true" className="fi fi-sr-wallet text-emerald-500" />
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
            {payDay ? (
              <>
                <button
                  onClick={goPrev}
                  className="p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <i
                    aria-hidden="true"
                    className="fi fi-sr-angle-left text-xs text-zinc-600 dark:text-zinc-400"
                  />
                </button>
                <span
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 text-zinc-700 dark:text-zinc-300 font-medium min-w-[200px] text-center"
                  title={formatPeriodLabel(payDay, month)}
                >
                  {(() => {
                    const r = getPeriodRange(payDay, month);
                    return `${r.start.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} — ${r.end.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}`;
                  })()}
                </span>
                <button
                  onClick={goNext}
                  className="p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <i
                    aria-hidden="true"
                    className="fi fi-sr-angle-right text-xs text-zinc-600 dark:text-zinc-400"
                  />
                </button>
              </>
            ) : (
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            )}
            <button
              onClick={() => qc.invalidateQueries({ queryKey: financeKeys.all })}
              className="p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
            >
              <i
                aria-hidden="true"
                className="fi fi-sr-rotate-left text-xs text-zinc-600 dark:text-zinc-400"
              />
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  setShowPayDayEditor(!showPayDayEditor);
                  setPayDayInput(payDay ? String(payDay) : '');
                }}
                className="p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                title="Period settings"
              >
                <i
                  aria-hidden="true"
                  className="fi fi-sr-settings text-xs text-zinc-600 dark:text-zinc-400"
                />
              </button>
              {showPayDayEditor && (
                <div className="absolute top-full right-0 mt-2 z-50 w-64 p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/60 dark:border-slate-700/50 shadow-xl">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                    Period Settings
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-xs text-zinc-500 shrink-0">Pay day:</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={payDayInput}
                      onChange={(e) => setPayDayInput(e.target.value)}
                      className="w-16 px-2 py-1 rounded text-xs bg-white/60 dark:bg-slate-700/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button
                      onClick={() => {
                        const n = parseInt(payDayInput, 10);
                        if (n >= 1 && n <= 31) setPayDay(n);
                      }}
                      className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                  {payDay && (
                    <button
                      onClick={() => setPayDay(null)}
                      className="text-xs text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      Reset to calendar months
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <FinanceSummary
            data={summaryData}
            transactions={summaryTransactions}
            loading={summaryLoading}
            error={txError ? 'Could not load summary' : null}
          />
        </div>
      )}

      {activeTab === 'transactions' && (
        <FinanceErrorBoundary tabName="Transactions">
          <TransactionList payDay={payDay} month={month} />
        </FinanceErrorBoundary>
      )}

      {activeTab === 'budgets' && (
        <FinanceErrorBoundary tabName="Budgets">
          <BudgetList month={month} payDay={payDay} />
        </FinanceErrorBoundary>
      )}

      {activeTab === 'subscriptions' && (
        <FinanceErrorBoundary tabName="Subscriptions">
          <SubscriptionList />
        </FinanceErrorBoundary>
      )}
    </div>
  );
}
