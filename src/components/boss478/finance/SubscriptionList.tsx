'use client';

import { useState, useEffect, useCallback } from 'react';
import SubscriptionForm from './SubscriptionForm';
import { CONFIG, getCategoryLabel } from '@/lib/config';

const { MONTHLY_NORMALIZER } = CONFIG.FINANCE;

interface Subscription {
  _id: string;
  name: string;
  amount: number;
  billingCycle: string;
  category: string;
  nextBillingDate: string;
  active: boolean;
  description?: string;
}

interface Props {
  refreshKey: number;
}

export default function SubscriptionList({ refreshKey }: Props) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/boss478/finance/api/subscriptions');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSubscriptions(data.subscriptions);
    } catch {
      setError('Could not load subscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions, refreshKey]);

  async function toggleActive(sub: Subscription) {
    try {
      const res = await fetch(`/boss478/finance/api/subscriptions?id=${sub._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !sub.active }),
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchSubscriptions();
    } catch {
      setError('Failed to update');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this subscription?')) return;
    try {
      const res = await fetch(`/boss478/finance/api/subscriptions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchSubscriptions();
    } catch {
      setError('Failed to delete');
    }
  }

  const monthlyCost = (sub: Subscription) => {
    const normalizer = MONTHLY_NORMALIZER[sub.billingCycle as keyof typeof MONTHLY_NORMALIZER] || 1;
    return sub.amount * normalizer;
  };

  const totalMonthly = subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => sum + monthlyCost(s), 0);

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const cycleLabel = (c: string) => c.charAt(0).toUpperCase() + c.slice(1);

  if (loading && subscriptions.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-white/40 dark:bg-slate-800/40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Active monthly total: <span className="font-semibold text-zinc-800 dark:text-zinc-200">฿{fmt(totalMonthly)}</span>
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <i className="fi fi-sr-add text-xs" />
          Add
        </button>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-50/80 dark:bg-red-900/30 border border-red-200/60 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && subscriptions.length === 0 ? (
        <div className="py-12 text-center">
          <i className="fi fi-sr-repeat text-3xl text-zinc-300 dark:text-zinc-600 mb-3 block" />
          <p className="text-zinc-400 dark:text-zinc-500 text-sm">No subscriptions yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Add your first subscription
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {subscriptions.map((sub) => (
            <div
              key={sub._id}
              className={`flex items-center gap-3 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border transition-colors ${
                sub.active
                  ? 'border-white/60 dark:border-slate-700/50'
                  : 'border-zinc-200/40 dark:border-slate-700/30 opacity-60'
              }`}
            >
              <button
                onClick={() => toggleActive(sub)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                  sub.active
                    ? 'bg-amber-100 dark:bg-amber-900/40'
                    : 'bg-zinc-100 dark:bg-slate-700'
                }`}
                title={sub.active ? 'Deactivate' : 'Activate'}
              >
                <i className={`fi fi-sr-repeat text-xs ${
                  sub.active ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'
                }`} />
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  sub.active ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-500'
                }`}>
                  {sub.name}
                </p>
                <p className="text-xs text-zinc-400">
                  {cycleLabel(sub.billingCycle)} · {getCategoryLabel(sub.category)}
                  {sub.description && ` · ${sub.description}`}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${
                  sub.active ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'
                }`}>
                  ฿{fmt(sub.amount)}/<span className="text-[10px]">{sub.billingCycle === 'monthly' ? 'mo' : sub.billingCycle === 'yearly' ? 'yr' : sub.billingCycle === 'weekly' ? 'wk' : 'qtr'}</span>
                </p>
                <p className="text-[10px] text-zinc-400">
                  Next: {new Date(sub.nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(sub._id)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer"
              >
                <i className="fi fi-sr-trash text-xs text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SubscriptionForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchSubscriptions(); }}
        />
      )}
    </div>
  );
}
