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

function advanceBillingDate(date: Date, cycle: string): Date {
  const d = new Date(date);
  switch (cycle) {
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

export default function SubscriptionList({ refreshKey }: Props) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

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

  async function handleRenew(sub: Subscription) {
    setRenewingId(sub._id);
    setError(null);
    const today = new Date().toISOString().slice(0, 10);
    try {
      const adv = advanceBillingDate(new Date(sub.nextBillingDate), sub.billingCycle);
      const patchRes = await fetch(`/boss478/finance/api/subscriptions?id=${sub._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextBillingDate: adv.toISOString() }),
      });
      if (!patchRes.ok) throw new Error('Failed to advance billing date');

      const postRes = await fetch('/boss478/finance/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          amount: sub.amount,
          category: sub.category,
          description: sub.name,
          date: today,
        }),
      });
      if (!postRes.ok) throw new Error('Failed to create expense');

      fetchSubscriptions();
    } catch {
      setError('Renew failed. Expense was not recorded.');
    } finally {
      setRenewingId(null);
    }
  }

  async function handleCancel(id: string) {
    setError(null);
    try {
      const res = await fetch(`/boss478/finance/api/subscriptions?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      });
      if (!res.ok) throw new Error('Failed to cancel');
      fetchSubscriptions();
    } catch {
      setError('Failed to cancel subscription');
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

  const activeSubs = subscriptions.filter((s) => s.active);
  const cancelledSubs = subscriptions.filter((s) => !s.active);

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
          <i className="fi fi-sr-refresh text-3xl text-zinc-300 dark:text-zinc-600 mb-3 block" />
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
          {activeSubs.map((sub) => (
            <div
              key={sub._id}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 dark:bg-amber-900/40">
                <i className="fi fi-sr-refresh text-xs text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {sub.name}
                </p>
                <p className="text-xs text-zinc-400">
                  {cycleLabel(sub.billingCycle)} · {getCategoryLabel(sub.category)}
                  {sub.description && ` · ${sub.description}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  ฿{fmt(sub.amount)}/<span className="text-[10px]">{sub.billingCycle === 'monthly' ? 'mo' : sub.billingCycle === 'yearly' ? 'yr' : sub.billingCycle === 'weekly' ? 'wk' : 'qtr'}</span>
                </p>
                <p className="text-[10px] text-zinc-400">
                  Next: {new Date(sub.nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleRenew(sub)}
                  disabled={renewingId === sub._id}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {renewingId === sub._id ? (
                    <i className="fi fi-sr-spinner animate-spin text-xs" />
                  ) : (
                    'Renew'
                  )}
                </button>
                <button
                  onClick={() => handleCancel(sub._id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(sub._id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer"
                >
                  <i className="fi fi-sr-trash text-xs text-red-400" />
                </button>
              </div>
            </div>
          ))}

          {cancelledSubs.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowCancelled(!showCancelled)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-zinc-400 dark:text-zinc-500 hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
              >
                <i className={`fi fi-sr-angle-small-${showCancelled ? 'down' : 'right'} text-xs`} />
                Show cancelled subscriptions ({cancelledSubs.length})
              </button>

              {showCancelled && (
                <div className="space-y-2 mt-2">
                  {cancelledSubs.map((sub) => (
                    <div
                      key={sub._id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/30 dark:bg-slate-800/30 border border-zinc-200/40 dark:border-slate-700/30 opacity-60"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-zinc-800">
                        <i className="fi fi-sr-refresh text-xs text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 truncate">
                          {sub.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {cycleLabel(sub.billingCycle)} · {getCategoryLabel(sub.category)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-zinc-400">
                          ฿{fmt(sub.amount)}/<span className="text-[10px]">{sub.billingCycle === 'monthly' ? 'mo' : sub.billingCycle === 'yearly' ? 'yr' : sub.billingCycle === 'weekly' ? 'wk' : 'qtr'}</span>
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          Cancelled
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
            </div>
          )}
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
