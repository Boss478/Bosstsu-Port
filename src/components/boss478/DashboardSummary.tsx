'use client';

import { useState, useEffect } from 'react';
import { getCurrentPeriodKey, getPeriodRange, formatPeriodLabel, PAY_DAY_KEY } from '@/lib/period';

interface StockSummary {
  holdingsCount: number;
  portfolioValue: number;
  portfolioPl: number;
  portfolioPlPercent: number;
  bestHolding: string | null;
  worstHolding: string | null;
}

interface BudgetSummary {
  incomeTotal: number;
  expenseTotal: number;
  subscriptionTotal: number;
  balance: number;
  label: string;
}

const MONTHLY_NORMALIZER: Record<string, number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (n: number) =>
  (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

export default function DashboardSummary() {
  const [payDay, setPayDay] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(PAY_DAY_KEY);
      const pd = raw ? parseInt(raw, 10) : null;
      setPayDay(pd && pd >= 1 && pd <= 31 ? pd : null);
      setLoaded(true);
    }
  }, []);

  const monthKey = payDay ? getCurrentPeriodKey(payDay) : new Date().toISOString().slice(0, 7);
  const displayLabel = payDay ? formatPeriodLabel(payDay, monthKey) : monthKey;

  const [stock, setStock] = useState<StockSummary | null>(null);
  const [stockLoading, setStockLoading] = useState(true);
  const [stockError, setStockError] = useState<string | null>(null);

  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;

    async function fetchStock() {
      try {
        const holdingsRes = await fetch('/boss478/api/holdings');
        if (!holdingsRes.ok) throw new Error('Failed to fetch holdings');

        const body = await holdingsRes.json();
        const holdings: any[] = body.holdings ?? [];

        if (!holdings.length) {
          if (!cancelled) {
            setStock({
              holdingsCount: 0, portfolioValue: 0, portfolioPl: 0,
              portfolioPlPercent: 0, bestHolding: null, worstHolding: null,
            });
          }
          return;
        }

        const symbols = holdings.map((h: any) => h.symbol);
        const quotesRes = await fetch('/api/stocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'quotes', symbols }),
        });

        let quotes: any[] = [];
        if (quotesRes.ok) {
          const q = await quotesRes.json();
          quotes = q.quotes ?? [];
        }

        const enriched = holdings.map((h: any) => {
          const current = quotes.find((q: any) => q.symbol === h.symbol);
          const price = h.manualPrice ?? current?.price ?? 0;
          const totalCost = h.shares * h.avgCost;
          const totalValue = h.shares * price;
          const pl = totalValue - totalCost;
          const plPercent = totalCost > 0 ? (pl / totalCost) * 100 : 0;
          return { symbol: h.symbol, totalValue, totalCost, pl, plPercent };
        });

        const totalValue = enriched.reduce((s, h) => s + h.totalValue, 0);
        const totalCost = enriched.reduce((s, h) => s + h.totalCost, 0);
        const totalPl = totalValue - totalCost;
        const totalPlPercent = totalCost > 0 ? (totalPl / totalCost) * 100 : 0;
        const sorted = [...enriched].sort((a, b) => b.plPercent - a.plPercent);

        if (!cancelled) {
          setStock({
            holdingsCount: holdings.length,
            portfolioValue: totalValue,
            portfolioPl: totalPl,
            portfolioPlPercent: totalPlPercent,
            bestHolding: sorted[0]?.symbol ?? null,
            worstHolding: sorted[sorted.length - 1]?.symbol ?? null,
          });
        }
      } catch {
        if (!cancelled) setStockError('Could not load portfolio data');
      } finally {
        if (!cancelled) setStockLoading(false);
      }
    }

    async function fetchBudget() {
      try {
        const [subRes] = await Promise.all([
          fetch('/boss478/finance/api/subscriptions'),
        ]);

        if (!subRes.ok) throw new Error('Failed to fetch');

        let txUrl: string;
        if (payDay) {
          const range = getPeriodRange(payDay, monthKey);
          txUrl = `/boss478/finance/api/transactions?startDate=${range.start.toISOString()}&endDate=${range.end.toISOString()}`;
        } else {
          txUrl = `/boss478/finance/api/transactions?month=${monthKey}`;
        }

        const txRes = await fetch(txUrl);
        if (!txRes.ok) throw new Error('Failed to fetch');

        const { transactions } = await txRes.json();
        const { subscriptions } = await subRes.json();

        const incomeTotal = (transactions ?? [])
          .filter((t: any) => t.type === 'income')
          .reduce((s: number, t: any) => s + t.amount, 0);
        const expenseTotal = (transactions ?? [])
          .filter((t: any) => t.type === 'expense')
          .reduce((s: number, t: any) => s + t.amount, 0);
        const subscriptionTotal = (subscriptions ?? [])
          .filter((s: any) => s.active)
          .reduce((sum: number, s: any) => {
            const n = MONTHLY_NORMALIZER[s.billingCycle as keyof typeof MONTHLY_NORMALIZER] ?? 1;
            return sum + s.amount * n;
          }, 0);

        if (!cancelled) {
          setBudget({
            incomeTotal,
            expenseTotal,
            subscriptionTotal,
            balance: incomeTotal - expenseTotal - subscriptionTotal,
            label: displayLabel,
          });
        }
      } catch {
        if (!cancelled) setBudgetError('Could not load budget data');
      } finally {
        if (!cancelled) setBudgetLoading(false);
      }
    }

    fetchStock();
    fetchBudget();

    return () => { cancelled = true; };
  }, [loaded, payDay, monthKey, displayLabel]);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
        <i className="fi fi-sr-apps text-blue-500" />
        Summary
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Stock / Portfolio Card */}
        <div className="rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm p-7">
          <div className="flex items-center gap-2 mb-3">
            <i className="fi fi-sr-stats text-sm text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Portfolio
            </span>
          </div>
          {stockLoading ? (
            <div className="space-y-2">
              <div className="h-5 w-32 rounded bg-white/40 dark:bg-slate-700/40 animate-pulse" />
              <div className="h-4 w-24 rounded bg-white/40 dark:bg-slate-700/40 animate-pulse" />
            </div>
          ) : stockError ? (
            <p className="text-xs text-red-500 dark:text-red-400">{stockError}</p>
          ) : stock ? (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  ${fmt(stock.portfolioValue)}
                </span>
                <span className={`text-sm font-medium ${stock.portfolioPl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {fmtPct(stock.portfolioPlPercent)}
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-0.5">
                <p>{stock.holdingsCount} holding{stock.holdingsCount !== 1 ? 's' : ''}</p>
                {stock.bestHolding && (
                  <p>Best: <span className="text-green-600 dark:text-green-400 font-medium">{stock.bestHolding}</span></p>
                )}
                {stock.worstHolding && (
                  <p>Worst: <span className="text-red-600 dark:text-red-400 font-medium">{stock.worstHolding}</span></p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Budget Card */}
        <div className="rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm p-7">
          <div className="flex items-center gap-2 mb-3">
            <i className="fi fi-sr-wallet text-sm text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Budget · {displayLabel}
            </span>
          </div>
          {budgetLoading ? (
            <div className="space-y-2">
              <div className="h-5 w-32 rounded bg-white/40 dark:bg-slate-700/40 animate-pulse" />
              <div className="h-4 w-24 rounded bg-white/40 dark:bg-slate-700/40 animate-pulse" />
            </div>
          ) : budgetError ? (
            <p className="text-xs text-red-500 dark:text-red-400">{budgetError}</p>
          ) : budget ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Income</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">฿{fmt(budget.incomeTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Expenses</span>
                <span className="text-red-600 dark:text-red-400 font-medium">฿{fmt(budget.expenseTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Subscriptions</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">฿{fmt(budget.subscriptionTotal)}</span>
              </div>
              <hr className="border-white/60 dark:border-slate-700/50 my-1" />
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-zinc-700 dark:text-zinc-300">Balance</span>
                <span className={budget.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}>
                  ฿{fmt(budget.balance)}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
