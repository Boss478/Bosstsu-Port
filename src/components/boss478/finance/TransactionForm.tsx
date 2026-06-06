'use client';

import { useState, FormEvent } from 'react';
import { CONFIG } from '@/lib/config';

const INCOME_CATS = CONFIG.FINANCE.CATEGORIES.income;
const EXPENSE_CATS = CONFIG.FINANCE.CATEGORIES.expense;

interface TransactionFormData {
  type: 'income' | 'expense';
  amount: string;
  category: string;
  description: string;
  date: string;
}

interface Props {
  editing?: TransactionFormData & { id: string };
  onClose: () => void;
  onSaved: () => void;
}

export default function TransactionForm({ editing, onClose, onSaved }: Props) {
  const [form, setForm] = useState<TransactionFormData>({
    type: editing?.type || 'expense',
    amount: editing?.amount || '',
    category: editing?.category || '',
    description: editing?.description || '',
    date: editing?.date || new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categories = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!form.category) {
      setError('Please select a category');
      return;
    }

    setSaving(true);
    try {
      const url = editing
        ? `/boss478/finance/api/transactions?id=${editing.id}`
        : '/boss478/finance/api/transactions';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/60 dark:border-slate-700/50 shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {editing ? 'Edit Transaction' : 'Add Transaction'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 cursor-pointer">
            <i aria-hidden="true" className="fi fi-sr-cross text-sm text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50/80 dark:bg-red-900/30 border border-red-200/60 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t, category: '' })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  form.type === t
                    ? t === 'expense'
                      ? 'bg-red-600 text-white'
                      : 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 dark:bg-slate-700 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {t === 'expense' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Amount (THB)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-slate-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
