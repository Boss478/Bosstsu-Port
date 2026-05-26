'use client';

import { useState } from 'react';
import { useStockData } from './StockDataContext';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PriceChart() {
  const { stocks, history } = useStockData();
  const [selected, setSelected] = useState(stocks[0]?.symbol ?? '');

  const data = history[selected] ?? [];

  if (data.length < 2) {
    return (
      <div className="p-8 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm text-center">
        <p className="text-zinc-500 dark:text-zinc-400">No chart data available for this period.</p>
      </div>
    );
  }

  const prices = data.map(d => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const stock = stocks.find(s => s.symbol === selected);
  const startPrice = prices[0];
  const endPrice = prices[prices.length - 1];
  const change = endPrice - startPrice;
  const changePercent = startPrice > 0 ? (change / startPrice) * 100 : 0;

  const WIDTH = 800;
  const HEIGHT = 300;
  const PAD = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartW = WIDTH - PAD.left - PAD.right;
  const chartH = HEIGHT - PAD.top - PAD.bottom;

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const yScale = (v: number) => PAD.top + chartH - ((v - min) / range) * chartH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.price).toFixed(1)}`).join('');

  const yTicks = 5;
  const yStep = range / (yTicks - 1);
  const yLabels: number[] = [];
  for (let i = 0; i < yTicks; i++) {
    yLabels.push(min + yStep * i);
  }

  const xTicks = Math.min(data.length, 6);
  const xStep = Math.max(1, Math.floor((data.length - 1) / (xTicks - 1)));
  const xLabels: number[] = [];
  for (let i = 0; i < xTicks; i++) {
    const idx = Math.min(i * xStep, data.length - 1);
    xLabels.push(idx);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {stocks.slice(0, 10).map((s, i) => (
          <button
            key={s.symbol}
            onClick={() => setSelected(s.symbol)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selected === s.symbol
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/50 text-zinc-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
            }`}
          >
            {s.symbol}
          </button>
        ))}
      </div>

      <div className="p-5 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{selected}</h3>
            {stock && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{stock.name}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              ${endPrice.toFixed(2)}
            </p>
            <p className={`text-sm font-medium flex items-center gap-1 justify-end ${
              change >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <i className={`fi ${change >= 0 ? 'fi-sr-caret-up' : 'fi-sr-caret-down'} text-xs`} />
              {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
            </p>
          </div>
        </div>

        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {yLabels.map((val, i) => (
            <g key={i}>
              <text x={PAD.left - 8} y={yScale(val) + 4} textAnchor="end" className="fill-zinc-400 text-[11px]">
                ${val.toFixed(0)}
              </text>
              {i > 0 && (
                <line
                  x1={PAD.left} y1={yScale(val)} x2={WIDTH - PAD.right} y2={yScale(val)}
                  className="stroke-zinc-200 dark:stroke-zinc-700"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              )}
            </g>
          ))}

          {xLabels.map(idx => (
            <text
              key={idx}
              x={xScale(idx)}
              y={HEIGHT - PAD.bottom + 18}
              textAnchor="middle"
              className="fill-zinc-400 text-[11px]"
            >
              {data[idx]?.date?.slice(5) ?? ''}
            </text>
          ))}

          <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          <circle cx={xScale(data.length - 1)} cy={yScale(prices[prices.length - 1])} r="3" fill="#2563eb" />
        </svg>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-4 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Open</p>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">${startPrice.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Close</p>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">${endPrice.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">High</p>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">${max.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Low</p>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">${min.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
