'use client';

import { useState, useEffect } from 'react';
import { CONFIG } from '@/lib/config';
import { formatShortDate } from '@/lib/format';
import {
  getPreviousPeriodKey,
  getNextPeriodKey,
  formatPeriodLabel,
  getPeriodRange,
} from '@/lib/period';

interface BudgetEntry {
  category: string;
  limit: number;
}

interface BudgetData {
  month: string;
  budgets: BudgetEntry[];
}

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
}

const INCOME_CATS = CONFIG.FINANCE.CATEGORIES.income;
const EXPENSE_CATS = CONFIG.FINANCE.CATEGORIES.expense;

function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string): string {
  const d = new Date(month + '-01');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function BudgetList({ month: externalMonth, payDay }: { month?: string; payDay?: number | null } = {}) {
  const [month, setMonth] = useState(externalMonth || new Date().toISOString().slice(0, 7));
  const [budgets, setBudgets] = useState<Map<string, number>>(new Map());
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  function toggleCategory(cat: string) {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    setExpandedCategories(next);
  }

  function expandAll() {
    const all = new Set<string>();
    for (const c of INCOME_CATS) all.add(c.value);
    for (const c of EXPENSE_CATS) all.add(c.value);
    setExpandedCategories(all);
  }

  function collapseAll() {
    setExpandedCategories(new Set());
  }

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const budgetUrl = `/boss478/finance/api/budgets?month=${month}`;
      let txUrl: string;
      if (payDay) {
        const range = getPeriodRange(payDay, month);
        txUrl = `/boss478/finance/api/transactions?startDate=${range.start.toISOString()}&endDate=${range.end.toISOString()}`;
      } else {
        txUrl = `/boss478/finance/api/transactions?month=${month}`;
      }
      const [budgetRes, txRes] = await Promise.all([
        fetch(budgetUrl),
        fetch(txUrl),
      ]);
      if (!budgetRes.ok || !txRes.ok) throw new Error('Failed to fetch');
      const budgetData: BudgetData = (await budgetRes.json()).budget;
      const txData = await txRes.json();
      const map = new Map<string, number>();
      for (const b of budgetData.budgets) {
        map.set(b.category, b.limit);
      }
      setBudgets(map);
      setAllTransactions(txData.transactions);
    } catch {
      setError('Could not load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (externalMonth) setMonth(externalMonth);
  }, [externalMonth]);

  useEffect(() => {
    fetchData();
  }, [month]);

  useEffect(() => {
    setExpandedCategories(new Set());
  }, [month]);

  async function handleDelete(id: string) {
    try {
      await fetch(`/boss478/finance/api/transactions?id=${id}`, { method: 'DELETE' });
      setAllTransactions((prev) => prev.filter((t) => t._id !== id));
    } catch {
      /* silent */
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    const budgetsArray: BudgetEntry[] = [];
    budgets.forEach((limit, category) => {
      budgetsArray.push({ category, limit });
    });
    try {
      const res = await fetch('/boss478/finance/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, budgets: budgetsArray }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSuccess('Budgets saved');
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError('Failed to save budgets');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyFromLast() {
    const lastMonth = previousMonth(month);
    try {
      const res = await fetch(`/boss478/finance/api/budgets?month=${lastMonth}`);
      if (!res.ok) throw new Error('No budget found');
      const data: BudgetData = (await res.json()).budget;
      if (!data.budgets || data.budgets.length === 0) {
        setError('No budgets from previous month');
        return;
      }
      const map = new Map<string, number>();
      for (const b of data.budgets) {
        map.set(b.category, b.limit);
      }
      setBudgets(map);
      setSuccess(`Copied from ${monthLabel(lastMonth)}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError('No budgets from previous month');
    }
  }

  function setLimit(category: string, value: string) {
    const next = new Map(budgets);
    const num = parseFloat(value);
    next.set(category, isNaN(num) ? 0 : num);
    setBudgets(next);
  }

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const pct = (used: number, limit: number) =>
    limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  function CategoryRow({ cat, type, descriptions }: { cat: { value: string; label: string }; type: 'income' | 'expense'; descriptions: string[] }) {
    const limit = budgets.get(cat.value) ?? 0;
    const isExpanded = expandedCategories.has(cat.value);
    const transactions = allTransactions.filter((t) => t.category === cat.value && t.type === type);
    const total = transactions.reduce((s, t) => s + t.amount, 0);
    const usagePct = pct(total, limit);
    const overBudget = limit > 0 && total > limit;
    const [addAmount, setAddAmount] = useState('');
    const [addDesc, setAddDesc] = useState('');
    const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0]);
    const [addSaving, setAddSaving] = useState(false);

    async function handleQuickAdd(e: React.FormEvent) {
      e.preventDefault();
      const num = parseFloat(addAmount);
      if (!num || num <= 0) return;
      setAddSaving(true);
      try {
        const res = await fetch('/boss478/finance/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, amount: num, category: cat.value, description: addDesc, date: addDate }),
        });
        if (!res.ok) throw new Error('Failed');
        const { transaction } = await res.json();
        setAllTransactions((prev) => [transaction, ...prev]);
        setAddAmount('');
        setAddDesc('');
        setAddDate(new Date().toISOString().split('T')[0]);
      } catch {
        /* silent */
      } finally {
        setAddSaving(false);
      }
    }

    const inputId = `desc-${cat.value}`;

    return (
      <div className="space-y-1">
        <div
          onClick={() => toggleCategory(cat.value)}
          className="flex items-center gap-3 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <i className={`fi fi-sr-angle-right text-xs text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">{cat.label}</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100/60 dark:bg-zinc-700/40">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Total</span>
            <span className={`text-sm font-bold ${overBudget ? 'text-red-500' : 'text-zinc-700 dark:text-zinc-200'}`}>
              ฿{fmt(total)}
            </span>
            {limit > 0 && (
              <span className="text-xs text-zinc-400">/ ฿{fmt(limit)}</span>
            )}
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider">Limit</span>
            <span className="text-xs text-zinc-400">฿</span>
            <input
              type="number"
              min="0"
              step="100"
              value={limit || ''}
              onChange={(e) => setLimit(cat.value, e.target.value)}
              placeholder="0"
              className="w-28 px-2 py-1 rounded text-sm bg-white/60 dark:bg-slate-700/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-right"
            />
          </div>
        </div>

        {isExpanded && (
          <div className="ml-4 p-3 rounded-lg bg-white/30 dark:bg-slate-800/30 border border-white/40 dark:border-slate-700/30">
            {limit > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                  <span>Usage</span>
                  <span className={overBudget ? 'text-red-500 font-semibold' : ''}>
                    ฿{fmt(total)} / ฿{fmt(limit)} ({usagePct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : usagePct > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
              </div>
            )}

            <form onSubmit={handleQuickAdd} className="flex flex-wrap items-center gap-2 mb-3 p-2 rounded bg-white/40 dark:bg-slate-700/30">
              <div className="flex-1 min-w-[120px] relative">
                <input
                  type="text"
                  value={addDesc}
                  onChange={(e) => setAddDesc(e.target.value)}
                  placeholder="Description"
                  list={inputId}
                  className="w-full px-2 py-1 rounded text-xs bg-white/60 dark:bg-slate-700/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
                <datalist id={inputId}>
                  {descriptions.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
              <div className="relative w-20">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400">฿</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-4 pr-2 py-1 rounded text-xs bg-white/60 dark:bg-slate-700/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  required
                />
              </div>
              <input
                type="date"
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
                className="w-32 px-2 py-1 rounded text-xs bg-white/60 dark:bg-slate-700/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
              <button
                type="submit"
                disabled={addSaving}
                className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                {addSaving ? 'Adding...' : 'Add'}
              </button>
            </form>

            {transactions.length === 0 ? (
              <p className="text-xs text-zinc-400 py-1">No transactions this month</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx._id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/40 dark:hover:bg-slate-700/30 group">
                    <span className="text-[10px] text-zinc-400 w-16 shrink-0">
                      {formatShortDate(tx.date)}
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 flex-1 truncate">
                      {tx.description || ''}
                    </span>
                    <span className={`text-xs font-medium shrink-0 ${
                      tx.type === 'expense' ? 'text-red-500' : 'text-emerald-500'
                    }`}>
                      {tx.type === 'expense' ? '-' : '+'}฿{fmt(tx.amount)}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(tx._id); }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/40 transition-opacity cursor-pointer"
                    >
                      <i className="fi fi-sr-trash text-[10px] text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
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
              <i className="fi fi-sr-angle-left text-xs text-zinc-600 dark:text-zinc-400" />
            </button>
            <span className="px-3 py-1.5 rounded-lg text-sm bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 text-zinc-700 dark:text-zinc-300 font-medium min-w-[200px] text-center">
              {formatPeriodLabel(payDay, month)}
            </span>
            <button
              onClick={() => setMonth(getNextPeriodKey(payDay, month))}
              className="p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
            >
              <i className="fi fi-sr-angle-right text-xs text-zinc-600 dark:text-zinc-400" />
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
          onClick={handleCopyFromLast}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500/80 text-white hover:bg-amber-600 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <i className="fi fi-sr-copy text-xs" />
          {payDay ? 'Copy from last period' : 'Copy from last month'}
        </button>
        <button
          onClick={expandAll}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-200/80 dark:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300/80 dark:hover:bg-zinc-600/80 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <i className="fi fi-sr-expand text-xs" />
          Expand
        </button>
        <button
          onClick={collapseAll}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-200/80 dark:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300/80 dark:hover:bg-zinc-600/80 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <i className="fi fi-sr-compress text-xs" />
          Collapse
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
        >
          <i className="fi fi-sr-floppy-disk text-xs" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-50/80 dark:bg-red-900/30 border border-red-200/60 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-900/30 border border-emerald-200/60 text-sm text-emerald-600 dark:text-emerald-400">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
            <i className="fi fi-sr-arrow-trend-up text-xs" />
            Income Budgets
          </h3>
          <div className="space-y-1">
            {INCOME_CATS.map((cat) => {
              const catDescs = Array.from(new Set(allTransactions.filter((t) => t.category === cat.value).map((t) => t.description || '').filter(Boolean)));
              return <CategoryRow key={cat.value} cat={cat} type="income" descriptions={catDescs} />;
            })}
            {INCOME_CATS.length < 1 && (
              <p className="text-xs text-zinc-400 py-2">No income categories</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
            <i className="fi fi-sr-shopping-cart text-xs" />
            Expense Budgets
          </h3>
          <div className="space-y-1">
            {EXPENSE_CATS.map((cat) => {
              const catDescs = Array.from(new Set(allTransactions.filter((t) => t.category === cat.value).map((t) => t.description || '').filter(Boolean)));
              return <CategoryRow key={cat.value} cat={cat} type="expense" descriptions={catDescs} />;
            })}
            {EXPENSE_CATS.length < 1 && (
              <p className="text-xs text-zinc-400 py-2">No expense categories</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
