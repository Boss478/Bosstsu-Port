'use client';

import { useStockData } from './StockDataContext';

export default function MarketOverview() {
  const { stocks, indexes, portfolio, watchlist } = useStockData();

  const gainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  const losers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

  const enriched = portfolio.map(h => {
    const current = stocks.find(s => s.symbol === h.symbol);
    const currentPrice = current?.price ?? 0;
    const totalCost = h.shares * h.avgCost;
    const totalValue = h.shares * currentPrice;
    const pl = totalValue - totalCost;
    const plPercent = totalCost > 0 ? (pl / totalCost) * 100 : 0;
    return { ...h, currentPrice, totalCost, totalValue, pl, plPercent };
  });

  const totalValue = enriched.reduce((s, h) => s + h.totalValue, 0);
  const totalCost = enriched.reduce((s, h) => s + h.totalCost, 0);
  const totalPl = totalValue - totalCost;
  const totalPlPercent = totalCost > 0 ? (totalPl / totalCost) * 100 : 0;

  const bestHolding = enriched.length > 0 ? [...enriched].sort((a, b) => b.plPercent - a.plPercent)[0] : null;
  const worstHolding = enriched.length > 0 ? [...enriched].sort((a, b) => a.plPercent - b.plPercent)[0] : null;

  const followed = stocks.filter(s => watchlist.includes(s.symbol));
  const bestWatch = followed.length > 0 ? [...followed].sort((a, b) => b.changePercent - a.changePercent)[0] : null;
  const worstWatch = followed.length > 0 ? [...followed].sort((a, b) => a.changePercent - b.changePercent)[0] : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {indexes.map(index => (
          <div
            key={index.name}
            className="p-4 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm"
          >
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              {index.name}
            </p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              {index.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-sm font-medium flex items-center gap-1 ${
              index.change >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <i className={`fi ${index.change >= 0 ? 'fi-sr-caret-up' : 'fi-sr-caret-down'} text-xs`} />
              {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%)
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-5 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
            <i className="fi fi-sr-briefcase text-blue-500" />
            Portfolio Summary
          </h3>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Total Value</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Total P&L</span>
              <span className={`font-semibold ${totalPl >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                {totalPl >= 0 ? '+' : ''}${totalPl.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({totalPlPercent >= 0 ? '+' : ''}{totalPlPercent.toFixed(2)}%)
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Holdings</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{portfolio.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Best</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {bestHolding ? `${bestHolding.symbol} (+${bestHolding.plPercent.toFixed(1)}%)` : '-'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Worst</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {worstHolding ? `${worstHolding.symbol} (${worstHolding.plPercent.toFixed(1)}%)` : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
            <i className="fi fi-sr-star text-amber-500" />
            Following Summary
          </h3>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Following</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{followed.length} stocks</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Best</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {bestWatch ? `${bestWatch.symbol} (+${bestWatch.changePercent.toFixed(2)}%)` : '-'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Worst</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {worstWatch ? `${worstWatch.symbol} (${worstWatch.changePercent.toFixed(2)}%)` : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-5 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <i className="fi fi-sr-arrow-trend-up text-blue-500" />
            Top Gainers
          </h3>
          <div className="space-y-3">
            {gainers.map(stock => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{stock.symbol}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    ${stock.price.toFixed(2)}
                  </p>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    +{stock.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <i className="fi fi-sr-arrow-trend-down text-red-500" />
            Top Losers
          </h3>
          <div className="space-y-3">
            {losers.map(stock => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{stock.symbol}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    ${stock.price.toFixed(2)}
                  </p>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    {stock.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200/60 dark:border-slate-700/50 text-left">
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400">Symbol</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400">Name</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Price</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Change</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right hidden sm:table-cell">Volume</th>
              <th className="py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right hidden lg:table-cell">Mkt Cap</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map(stock => (
              <tr
                key={stock.symbol}
                className="border-b last:border-0 border-zinc-100/60 dark:border-slate-700/30 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">{stock.symbol}</td>
                <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{stock.name}</td>
                <td className="py-3 px-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                  ${stock.price.toFixed(2)}
                </td>
                <td className={`py-3 px-4 text-right font-medium ${
                  stock.change >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <span className="flex items-center justify-end gap-1">
                    <i className={`fi ${stock.change >= 0 ? 'fi-sr-caret-up' : 'fi-sr-caret-down'} text-xs`} />
                    {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">
                  {(stock.volume / 1000000).toFixed(1)}M
                </td>
                <td className="py-3 px-4 text-right text-zinc-500 dark:text-zinc-400 hidden lg:table-cell">
                  ${(stock.marketCap / 1000000000000).toFixed(2)}T
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
