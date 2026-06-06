'use client';

import { useState, FormEvent } from 'react';
import { CONFIG } from '@/lib/config';

const CATEGORIES = CONFIG.FINANCE.CATEGORIES.expense;
const CYCLES = CONFIG.FINANCE.BILLING_CYCLES;

interface Props {
  onClose: () => void;
  onSaved: () => void;
  editing?: {
    id: string;
    name: string;
    amount: string;
    billingCycle: string;
    category: string;
    nextBillingDate: string;
    description: string;
  } | null;
}

export default function SubscriptionForm({ onClose, onSaved, editing }: Props) {
  const [name, setName] = useState(editing?.name || '');
  const [amount, setAmount] = useState(editing?.amount || '');
  const [billingCycle, setBillingCycle] = useState(editing?.billingCycle || 'monthly');
  const [category, setCategory] = useState(editing?.category || '');
  const [nextBillingDate, setNextBillingDate] = useState(
    editing?.nextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [description, setDescription] = useState(editing?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }

    setSaving(true);
    try {
      const url = editing
        ? `/boss478/finance/api/subscriptions?id=${editing.id}`
        : '/boss478/finance/api/subscriptions';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          amount: amt,
          billingCycle,
          category,
          nextBillingDate,
          description: description.trim(),
        }),
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

  const cycleLabel = (c: string) => c.charAt(0).toUpperCase() + c.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/60 dark:border-slate-700/50 shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {editing ? 'Edit Subscription' : 'Add Subscription'}
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

          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Netflix, Spotify, ..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Amount (THB)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {CYCLES.map((c) => (
                  <option key={c} value={c}>{cycleLabel(c)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              >
                <option value="">Select</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Next Billing</label>
              <input
                type="date"
                value={nextBillingDate}
                onChange={(e) => setNextBillingDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notes</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-600 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Optional"
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
