'use client';

import { useState, FormEvent } from 'react';
import { CONFIG } from '@/lib/config';

const INCOME_CATS = CONFIG.FINANCE.CATEGORIES.income;
const EXPENSE_CATS = CONFIG.FINANCE.CATEGORIES.expense;

interface QuickTransaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
}

interface Props {
  onAdd: (tx: QuickTransaction) => void;
}

export default function QuickAddBar({ onAdd }: Props) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categories = type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  function reset() {
    setAmount('');
    setCategory('');
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/boss478/finance/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount: num, category, date: new Date().toISOString() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      const data = await res.json();
      onAdd(data.transaction);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-2 mb-4 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm"
    >
      <div className="flex rounded-lg overflow-hidden border border-zinc-200 dark:border-slate-600">
        <button
          type="button"
          onClick={() => { setType('expense'); setCategory(''); }}
          className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            type === 'expense'
              ? 'bg-red-600 text-white'
              : 'bg-white/60 dark:bg-slate-700/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-slate-600'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => { setType('income'); setCategory(''); }}
          className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            type === 'income'
              ? 'bg-emerald-600 text-white'
              : 'bg-white/60 dark:bg-slate-700/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-slate-600'
          }`}
        >
          Income
        </button>
      </div>

      <div className="relative flex-1 min-w-[120px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">฿</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="w-full pl-6 pr-3 py-1.5 rounded-lg text-sm bg-white/60 dark:bg-slate-700/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg text-sm bg-white/60 dark:bg-slate-700/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <option value="">Category</option>
        {categories.map((cat) => (
          <option key={cat.value} value={cat.value}>{cat.label}</option>
        ))}
      </select>

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
      >
        <i className="fi fi-sr-add text-xs" />
        {saving ? 'Adding...' : 'Add'}
      </button>

      {error && (
        <p className="w-full text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
      )}
    </form>
  );
}
