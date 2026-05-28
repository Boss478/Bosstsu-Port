'use client';

import { useState } from 'react';
import { useStockData } from './StockDataContext';

export default function Watchlist() {
  const { stocks, watchlist, addToWatchlist, removeFromWatchlist } = useStockData();
  const [search, setSearch] = useState('');
  const currency = (s: string) => s.endsWith('.BK') ? '฿' : '$';

  const watched = stocks.filter(s => watchlist.includes(s.symbol));
  const available = stocks.filter(s => !watchlist.includes(s.symbol));
  const filtered = available.filter(
    s => s.symbol.toLowerCase().includes(search.toLowerCase()) ||
         s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="p-5 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
          <i className="fi fi-sr-star text-amber-500" />
          Watchlist
        </h3>

        {watched.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8">
            No stocks in your watchlist yet.
          </p>
        ) : (
          <div className="space-y-2">
            {watched.map(stock => (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-3 rounded-xl bg-blue-50/40 dark:bg-slate-700/30 hover:bg-blue-50/60 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => removeFromWatchlist(stock.symbol)}
                    className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove"
                  >
                    <i className="fi fi-sr-cross text-xs" />
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{stock.symbol}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {currency(stock.symbol)}{stock.price.toFixed(2)}
                  </p>
                    <p className={`text-xs font-medium ${
                      stock.change >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      <div className="p-5 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
          <i className="fi fi-sr-search text-blue-500" />
          Add Stock
        </h3>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or symbol..."
          className="w-full px-3 py-2 rounded-lg text-sm border border-zinc-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 mb-3"
        />

        <div className="space-y-1 max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-4">No stocks found.</p>
          ) : (
            filtered.map(stock => (
              <button
                key={stock.symbol}
                onClick={() => {
                  addToWatchlist(stock.symbol);
                  setSearch('');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{stock.symbol}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {currency(stock.symbol)}{stock.price.toFixed(2)}
                  </p>
                  <p className={`text-xs font-medium ${
                    stock.change >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
