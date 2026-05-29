'use client';

import { useState, useEffect } from 'react';
import { CONFIG } from '@/lib/config';
import { formatShortDate } from '@/lib/format';

const { MONTHLY_NORMALIZER } = CONFIG.FINANCE;
const EXPENSE_CATS = CONFIG.FINANCE.CATEGORIES.expense;

interface SummaryData {
  incomeTotal: number;
  expenseTotal: number;
  subscriptionTotal: number;
  allExpense: number;
  netRemaining: number;
  month: string;
}

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
}

interface Props {
  data: SummaryData | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

const DONUT_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function DonutChart({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
  const cx = 120, cy = 120, R = 100, holeR = 55;
  const total = data.reduce((s, d) => s + d.value, 0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  if (total === 0) return null;

  let currentAngle = -Math.PI / 2;
  const slices = data.map((d) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;
    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    const path = `M ${cx},${cy} L ${x1.toFixed(1)},${y1.toFixed(1)} A ${R},${R} 0 ${largeArcFlag} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
    return { path, color: d.color, label: d.label, value: d.value, pct: (d.value / total) * 100 };
  });

  const hovered = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
      <svg viewBox="0 0 240 240" className="w-44 h-44 shrink-0">
        {slices.map((s, i) => (
          <path
            key={i}
            d={s.path}
            fill={s.color}
            opacity={hoveredIndex !== null && hoveredIndex !== i ? 0.5 : 1}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => setHoveredIndex(hoveredIndex === i ? null : i)}
            className="transition-opacity cursor-pointer"
          />
        ))}
        <circle cx={cx} cy={cy} r={holeR} className="fill-white dark:fill-slate-800 pointer-events-none" />
        {hovered ? (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" className="fill-zinc-800 dark:fill-zinc-200 text-xs font-bold" fontSize="14">
              {hovered.label}
            </text>
            <text x={cx} y={cy + 8} textAnchor="middle" className="fill-zinc-800 dark:fill-zinc-200 text-sm font-bold" fontSize="16">
              ฿{fmt(hovered.value)}
            </text>
            <text x={cx} y={cy + 20} textAnchor="middle" className="fill-zinc-400 text-[10px]" fontSize="10">
              {hovered.pct.toFixed(0)}%
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 4} textAnchor="middle" className="fill-zinc-800 dark:fill-zinc-200 text-lg font-bold" fontSize="18">
              ฿{fmt(total)}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" className="fill-zinc-400 text-xs" fontSize="11">
              Total
            </text>
          </>
        )}
      </svg>
      <div className="space-y-1.5 w-full">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-zinc-600 dark:text-zinc-400 flex-1">{s.label}</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{s.pct.toFixed(0)}%</span>
            <span className="text-zinc-400">฿{fmt(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollapsiblePanel({ title, icon, defaultOpen = false, children }: { title: string; icon: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-white/30 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
      >
        <i className={`fi ${icon} text-xs text-zinc-500`} />
        <span className="flex-1 text-left">{title}</span>
        <i className={`fi fi-sr-angle-right text-xs text-zinc-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function FinanceSummary({ data, transactions, loading, error }: Props) {
  const [budgets, setBudgets] = useState<Map<string, number>>(new Map());
  const [budgetsLoading, setBudgetsLoading] = useState(false);

  useEffect(() => {
    if (!data) return;
    setBudgetsLoading(true);
    fetch(`/boss478/finance/api/budgets?month=${data.month}`)
      .then((r) => r.json())
      .then((res) => {
        const map = new Map<string, number>();
        for (const b of res.budget?.budgets || []) {
          map.set(b.category, b.limit);
        }
        setBudgets(map);
      })
      .catch(() => {})
      .finally(() => setBudgetsLoading(false));
  }, [data?.month]);

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/40 dark:bg-slate-800/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 px-4 py-3 rounded-lg bg-red-50/80 dark:bg-red-900/30 border border-red-200/60 dark:border-red-700/50 text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mb-6 px-4 py-8 text-center text-zinc-400 dark:text-zinc-500 text-sm rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/60 dark:border-slate-700/50">
        No data for this month
      </div>
    );
  }

  const cards = [
    { label: 'Net Income', value: data.incomeTotal, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/60 dark:bg-emerald-900/30', icon: 'fi-sr-arrow-trend-up' },
    { label: 'All Expense', value: data.allExpense, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50/60 dark:bg-red-900/30', icon: 'fi-sr-shopping-cart' },
    { label: 'Net Remaining', value: data.netRemaining, color: data.netRemaining >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400', bg: 'bg-blue-50/60 dark:bg-blue-900/30', icon: 'fi-sr-coins' },
  ];

  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const top5Expenses = [...expenseTransactions].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const catBreakdown = EXPENSE_CATS.map((cat) => {
    const total = expenseTransactions
      .filter((t) => t.category === cat.value)
      .reduce((s, t) => s + t.amount, 0);
    const limit = budgets.get(cat.value) ?? 0;
    return { cat, total, limit };
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-xl p-4 border border-white/60 dark:border-slate-700/50 backdrop-blur-sm`}
          >
            <div className="flex items-center gap-2 mb-1">
              <i className={`fi ${card.icon} text-xs ${card.color}`} />
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {card.label}
              </span>
            </div>
            <p className={`text-xl font-bold ${card.color}`}>
              ฿{fmt(card.value)}
            </p>
            {card.label === 'All Expense' && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                Subscription ฿{fmt(data.subscriptionTotal)}
              </p>
            )}
          </div>
        ))}
      </div>

      {expenseTransactions.length > 0 && (
        <div className="rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 p-4">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
            <i className="fi fi-sr-chart-pie text-xs text-zinc-500" />
            Expense Breakdown
          </h3>
          <DonutChart
            data={catBreakdown
              .filter((c) => c.total > 0)
              .map((c, i) => ({ label: c.cat.label, value: c.total, color: DONUT_COLORS[i % DONUT_COLORS.length] }))}
          />
          {top5Expenses.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Top Expense</span>
                <span className="text-zinc-400">
                  {formatShortDate(top5Expenses[0].date)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                  {top5Expenses[0].category}{top5Expenses[0].description ? ` — ${top5Expenses[0].description}` : ''}
                </span>
                <span className="text-sm font-bold text-red-500">-฿{fmt(top5Expenses[0].amount)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CollapsiblePanel title="Category Breakdown" icon="fi-sr-budget" defaultOpen={true}>
          {budgetsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-white/40 dark:bg-slate-800/40 animate-pulse" />
              ))}
            </div>
          ) : catBreakdown.length === 0 ? (
            <p className="text-xs text-zinc-400 py-2">No expense categories</p>
          ) : (
            <div className="space-y-2">
              {catBreakdown.map(({ cat, total, limit }) => {
                const pct = limit > 0 ? Math.min((total / limit) * 100, 100) : 0;
                const over = limit > 0 && total > limit;
                return (
                  <div key={cat.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/30 dark:hover:bg-slate-700/30">
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 min-w-[100px]">{cat.label}</span>
                    <span className="text-xs text-zinc-500 w-28 text-right">฿{fmt(total)}</span>
                    {limit > 0 && (
                      <>
                        <span className="text-[10px] text-zinc-400 w-20 text-right">/ ฿{fmt(limit)}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden max-w-[120px]">
                          <div className={`h-full rounded-full ${over ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-[10px] w-10 text-right ${over ? 'text-red-500 font-semibold' : 'text-zinc-400'}`}>
                          {pct.toFixed(0)}%
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CollapsiblePanel>

        <CollapsiblePanel title="Top 5 Expenses" icon="fi-sr-fire" defaultOpen={true}>
          {top5Expenses.length === 0 ? (
            <p className="text-xs text-zinc-400 py-2">No expenses this month</p>
          ) : (
            <div className="space-y-1">
              {top5Expenses.map((tx) => (
                <div key={tx._id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/30 dark:hover:bg-slate-700/30">
                  <span className="text-[10px] text-zinc-400 w-16 shrink-0">
                    {formatShortDate(tx.date)}
                  </span>
                  <span className="text-xs text-zinc-500 w-20 shrink-0">{tx.category}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 flex-1">
                    {tx.description || ''}
                  </span>
                  <span className="text-xs font-medium text-red-500 shrink-0">
                    -฿{fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CollapsiblePanel>
      </div>
      </div>
  );
}
