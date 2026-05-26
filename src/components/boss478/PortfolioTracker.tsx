'use client';

import { useStockData } from './StockDataContext';

export default function PortfolioTracker() {
  const { portfolio, stocks } = useStockData();

  const enriched = portfolio.map(h => {
    const current = stocks.find(s => s.symbol === h.symbol);
    const currentPrice = current?.price ?? 0;
    const totalCost = h.shares * h.avgCost;
    const totalValue = h.shares * currentPrice;
    const pl = totalValue - totalCost;
    const plPercent = totalCost > 0 ? (pl / totalCost) * 100 : 0;
    return { ...h, currentPrice, totalCost, totalValue, pl, plPercent };
  });

  const totalCost = enriched.reduce((s, h) => s + h.totalCost, 0);
  const totalValue = enriched.reduce((s, h) => s + h.totalValue, 0);
  const totalPl = totalValue - totalCost;
  const totalPlPercent = totalCost > 0 ? (totalPl / totalCost) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">มูลค่ารวม</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">ต้นทุนรวม</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">กำไร/ขาดทุน</p>
            <p className={`text-2xl font-bold flex items-center gap-1 ${
              totalPl >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <i className={`fi ${totalPl >= 0 ? 'fi-sr-caret-up' : 'fi-sr-caret-down'}`} />
              ${Math.abs(totalPl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              <span className="text-sm font-medium">
                ({totalPlPercent >= 0 ? '+' : ''}{totalPlPercent.toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200/60 dark:border-slate-700/50 text-left">
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400">Symbol</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Shares</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Avg Cost</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Current</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Value</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">P&L</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right hidden sm:table-cell">Allocation</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map(h => {
              const allocation = totalValue > 0 ? (h.totalValue / totalValue) * 100 : 0;
              return (
                <tr
                  key={h.symbol}
                  className="border-b last:border-0 border-zinc-100/60 dark:border-slate-700/30 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">{h.symbol}</td>
                  <td className="py-3 px-4 text-right text-zinc-700 dark:text-zinc-300">{h.shares}</td>
                  <td className="py-3 px-4 text-right text-zinc-700 dark:text-zinc-300">${h.avgCost.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-zinc-700 dark:text-zinc-300">${h.currentPrice.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                    ${h.totalValue.toFixed(2)}
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${
                    h.pl >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    ${h.pl >= 0 ? '+' : ''}{h.pl.toFixed(2)}
                    <br />
                    <span className="text-xs">({h.plPercent >= 0 ? '+' : ''}{h.plPercent.toFixed(2)}%)</span>
                  </td>
                  <td className="py-3 px-4 text-right hidden sm:table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{allocation.toFixed(1)}%</span>
                      <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${allocation}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
