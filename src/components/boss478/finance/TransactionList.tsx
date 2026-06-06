'use client';

import { useState, useEffect, useCallback } from 'react';
import TransactionForm from './TransactionForm';
import QuickAddBar from './QuickAddBar';
import { getCategoryLabel } from '@/lib/config';
import { formatShortDate } from '@/lib/format';
import {
  getCurrentPeriodKey,
  getPreviousPeriodKey,
  getNextPeriodKey,
  formatPeriodLabel,
  getPeriodRange,
  isCurrentPeriod,
} from '@/lib/period';

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
}

interface Props {
  refreshKey: number;
  payDay?: number | null;
  month?: string;
}

export default function TransactionList({ refreshKey, payDay, month: externalMonth }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(externalMonth || (payDay ? getCurrentPeriodKey(payDay) : new Date().toISOString().slice(0, 7)));
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{ id: string; type: 'income' | 'expense'; amount: string; category: string; description: string; date: string } | null>(null);

  useEffect(() => {
    if (externalMonth) setMonth(externalMonth);
  }, [externalMonth]);

  useEffect(() => {
    if (!month && payDay) {
      setMonth(getCurrentPeriodKey(payDay));
    }
  }, [payDay]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (payDay) {
        const range = getPeriodRange(payDay, month);
        params.set('startDate', range.start.toISOString());
        params.set('endDate', range.end.toISOString());
      } else {
        params.set('month', month);
      }
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await fetch(`/boss478/finance/api/transactions?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTransactions(data.transactions);
    } catch {
      setError('Could not load transactions');
    } finally {
      setLoading(false);
    }
  }, [month, typeFilter, payDay]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return;
    try {
      const res = await fetch(`/boss478/finance/api/transactions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchTransactions();
    } catch {
      setError('Failed to delete');
    }
  }

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const monthLabel = (m: string) => {
    const d = new Date(m + '-01');
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-white/40 dark:bg-slate-800/40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {payDay ? (
          <>
            <button
              onClick={() => setMonth(getPreviousPeriodKey(payDay, month))}
              className="p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
            >
              <i aria-hidden="true" className="fi fi-sr-angle-left text-xs text-zinc-600 dark:text-zinc-400" />
            </button>
            <span className="px-3 py-1.5 rounded-lg text-sm bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 text-zinc-700 dark:text-zinc-300 font-medium min-w-[200px] text-center">
              {formatPeriodLabel(payDay, month)}
            </span>
            <button
              onClick={() => setMonth(getNextPeriodKey(payDay, month))}
              className="p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
            >
              <i aria-hidden="true" className="fi fi-sr-angle-right text-xs text-zinc-600 dark:text-zinc-400" />
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
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <div className="ml-auto">
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <i aria-hidden="true" className="fi fi-sr-add text-xs" />
            Add
          </button>
        </div>
      </div>

      {payDay ? (
        isCurrentPeriod(payDay, month) && (
          <QuickAddBar onAdd={(tx) => setTransactions((prev) => [tx, ...prev])} />
        )
      ) : (
        month === new Date().toISOString().slice(0, 7) && (
          <QuickAddBar onAdd={(tx) => setTransactions((prev) => [tx, ...prev])} />
        )
      )}

      {payDay ? (
        !isCurrentPeriod(payDay, month) && (
          <p className="text-xs text-zinc-400 mb-3">{formatPeriodLabel(payDay, month)}</p>
        )
      ) : (
        month !== new Date().toISOString().slice(0, 7) && (
          <p className="text-xs text-zinc-400 mb-3">{monthLabel(month)}</p>
        )
      )}

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-50/80 dark:bg-red-900/30 border border-red-200/60 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && transactions.length === 0 ? (
        <div className="py-12 text-center">
          <i aria-hidden="true" className="fi fi-sr-empty text-3xl text-zinc-300 dark:text-zinc-600 mb-3 block" />
          <p className="text-zinc-400 dark:text-zinc-500 text-sm">No transactions yet</p>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Add your first transaction
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <div
              key={t._id}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                t.type === 'expense' ? 'bg-red-100 dark:bg-red-900/40' : 'bg-emerald-100 dark:bg-emerald-900/40'
              }`}>
                <i className={`fi ${t.type === 'expense' ? 'fi-sr-shopping-cart' : 'fi-sr-arrow-trend-up'} text-xs ${
                  t.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {t.description || getCategoryLabel(t.category)}
                </p>
                <p className="text-xs text-zinc-400">{getCategoryLabel(t.category)}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${
                  t.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {t.type === 'expense' ? '-' : '+'}฿{fmt(t.amount)}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {formatShortDate(t.date)}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing({
                      id: t._id,
                      type: t.type,
                      amount: t.amount.toString(),
                      category: t.category,
                      description: t.description || '',
                      date: t.date.slice(0, 10),
                    });
                    setShowForm(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <i aria-hidden="true" className="fi fi-sr-pencil text-xs text-zinc-400" />
                </button>
                <button
                  onClick={() => handleDelete(t._id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer"
                >
                  <i aria-hidden="true" className="fi fi-sr-trash text-xs text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TransactionForm
          editing={editing || undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); fetchTransactions(); }}
        />
      )}
    </div>
  );
}
