'use client';

import { useStockData } from './StockDataContext';

export default function MarketOverview() {
  const { indexes, stocks } = useStockData();

  const gainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  const losers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

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

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-5 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <i className="fi fi-sr-trend-up text-blue-500" />
            ขึ้นมากที่สุด
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
            <i className="fi fi-sr-trend-down text-red-500" />
            ลงมากที่สุด
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
