'use client';

import { useState, useMemo } from 'react';
import { useStockData } from './StockDataContext';
import { useEnrichedHoldings, usePortfolioAggregates } from './useEnrichedHoldings';

export default function MarketOverview() {
  const { stocks, indexes, portfolio, watchlist } = useStockData();
  const [sortKey, setSortKey] = useState<string>('symbol');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedStocks = useMemo(() => {
    return [...stocks].sort((a: any, b: any) => {
      let va: any;
      let vb: any;
      if (sortKey === 'name') {
        va = a.name.toLowerCase();
        vb = b.name.toLowerCase();
      } else {
        va = (a as any)[sortKey] ?? 0;
        vb = (b as any)[sortKey] ?? 0;
      }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
  }, [stocks, sortKey, sortDir]);

  const sortIndicator = (key: string) => {
    if (sortKey !== key) return null;
    return <span className="ml-1 text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };

  const gainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  const losers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

  const enriched = useEnrichedHoldings(portfolio, stocks);
  const { totalValue, totalCost, totalPl, totalPlPercent, bestHolding, worstHolding } = usePortfolioAggregates(enriched);

  const followed = stocks.filter(s => watchlist.includes(s.symbol));
  const bestWatch = followed.length > 0 ? [...followed].sort((a, b) => b.changePercent - a.changePercent)[0] : null;
  const worstWatch = followed.length > 0 ? [...followed].sort((a, b) => a.changePercent - b.changePercent)[0] : null;

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currency = (s: string) => s.endsWith('.BK') ? '฿' : '$';

  const renderSortableHeader = (key: string, label: string, className = '') => (
    <th
      className={`py-3 px-4 font-semibold text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200 select-none transition-colors ${className}`}
      onClick={() => handleSort(key)}
    >
      {label}{sortIndicator(key)}
    </th>
  );

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
              {fmt(index.value)}
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
                ฿{fmt(totalValue)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Total P&L</span>
              <span className={`font-semibold ${totalPl >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                {totalPl >= 0 ? '+' : ''}฿{fmt(totalPl)} ({totalPlPercent >= 0 ? '+' : ''}{totalPlPercent.toFixed(2)}%)
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
                    {currency(stock.symbol)}{fmt(stock.price)}
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
                    {currency(stock.symbol)}{fmt(stock.price)}
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
              {renderSortableHeader('symbol', 'Symbol')}
              {renderSortableHeader('name', 'Name')}
              {renderSortableHeader('price', 'Price', 'text-right')}
              {renderSortableHeader('changePercent', 'Change', 'text-right')}
              {renderSortableHeader('volume', 'Volume', 'text-right hidden sm:table-cell')}
              {renderSortableHeader('marketCap', 'Mkt Cap', 'text-right hidden lg:table-cell')}
            </tr>
          </thead>
          <tbody>
            {sortedStocks.map(stock => (
              <tr
                key={stock.symbol}
                className="border-b last:border-0 border-zinc-100/60 dark:border-slate-700/30 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">{stock.symbol}</td>
                <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{stock.name}</td>
                <td className="py-3 px-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                  {currency(stock.symbol)}{fmt(stock.price)}
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
                  {currency(stock.symbol)}{(stock.marketCap / 1000000000000).toFixed(2)}T
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
