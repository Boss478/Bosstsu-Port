'use client';

import { useStockData, PERIOD_CONFIG, type Period } from './StockDataContext';
import PriceChart from './PriceChart';
import { useEffect } from 'react';

interface StockDetailModalProps {
  symbol: string;
  onClose: () => void;
}

export default function StockDetailModal({ symbol, onClose }: StockDetailModalProps) {
  const { stocks, period, setPeriod } = useStockData();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return null;

  const changePositive = stock.change >= 0;

  const formatLarge = (v: number): string => {
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    return `$${v.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-5xl mx-4 my-4 sm:my-8">
        <div className="rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xl overflow-hidden">
          <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-zinc-200/60 dark:border-slate-700/50 px-4 sm:px-6 py-3 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <i className="fi fi-sr-arrow-left" />
              Back
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <i className="fi fi-sr-cross text-lg" />
            </button>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {symbol.slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{stock.name}</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{symbol}</p>
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                  ${stock.price.toFixed(2)}
                </p>
                <p className={`text-base font-medium flex items-center gap-1 sm:justify-end ${
                  changePositive ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <i className={`fi ${changePositive ? 'fi-sr-caret-up' : 'fi-sr-caret-down'} text-sm`} />
                  {changePositive ? '+' : ''}{stock.change.toFixed(2)} ({changePositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                  <span className="text-xs text-zinc-400 font-normal ml-1">Today</span>
                </p>
              </div>
            </div>

            <div className="flex gap-1 p-0.5 rounded-lg bg-blue-50/40 dark:bg-slate-700/40 mb-6 overflow-x-auto">
              {PERIOD_CONFIG.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    period === p.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <PriceChart initialSymbol={symbol} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <StatBox label="Open" value={`$${stock.open.toFixed(2)}`} />
              <StatBox label="High" value={`$${stock.regularMarketDayHigh.toFixed(2)}`} />
              <StatBox label="Low" value={`$${stock.regularMarketDayLow.toFixed(2)}`} />
              <StatBox label="Prev Close" value={`$${stock.previousClose.toFixed(2)}`} />
              <StatBox label="Mkt Cap" value={formatLarge(stock.marketCap)} />
              <StatBox label="P/E Ratio" value={stock.peRatio > 0 ? stock.peRatio.toFixed(2) : '—'} />
              <StatBox label="52-wk High" value={`$${stock.fiftyTwoWeekHigh.toFixed(2)}`} />
              <StatBox label="52-wk Low" value={`$${stock.fiftyTwoWeekLow.toFixed(2)}`} />
              <StatBox label="Div Yield" value={stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '—'} />
              <StatBox label="Div Amount" value={stock.dividendAmount > 0 ? `$${stock.dividendAmount.toFixed(2)}` : '—'} />
              <StatBox label="Volume" value={(stock.volume / 1000000).toFixed(1) + 'M'} />
              <StatBox label="Sector" value={stock.sector || '—'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}
