'use client';

import { useState, useMemo } from 'react';
import { useStockData, PERIOD_CONFIG, type Period } from './StockDataContext';

interface PriceChartProps {
  initialSymbol?: string;
}

export default function PriceChart({ initialSymbol }: PriceChartProps) {
  const { stocks, history, period, setPeriod } = useStockData();
  const hasInitial = initialSymbol && stocks.some(s => s.symbol === initialSymbol);
  const [selected, setSelected] = useState(hasInitial ? initialSymbol! : (stocks[0]?.symbol ?? ''));
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const tzLabel = useMemo(() => {
    const offset = -(new Date().getTimezoneOffset()) / 60;
    const local = `UTC${offset >= 0 ? '+' : ''}${offset}`;
    const now = new Date();
    const mar1 = new Date(now.getFullYear(), 2, 1).getDay();
    const dstStart = new Date(now.getFullYear(), 2, mar1 === 0 ? 8 : 15 - mar1, 7);
    const nov1 = new Date(now.getFullYear(), 10, 1).getDay();
    const dstEnd = new Date(now.getFullYear(), 10, nov1 === 0 ? 1 : 8 - nov1, 6);
    const et = now >= dstStart && now < dstEnd ? 'EDT (UTC-4)' : 'EST (UTC-5)';
    return `${local} · ${et} · UTC`;
  }, []);

  const displaySymbol = hasInitial ? initialSymbol! : selected;
  const data = history[displaySymbol] ?? [];

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
  const stock = stocks.find(s => s.symbol === displaySymbol);
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

  const xTicks = Math.min(data.length, 8);
  const xStep = Math.max(1, Math.floor((data.length - 1) / (xTicks - 1)));
  const xLabels: number[] = [];
  for (let i = 0; i < xTicks; i++) {
    const idx = Math.min(i * xStep, data.length - 1);
    xLabels.push(idx);
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  const formatXLabel = (idx: number) => {
    const d = data[idx];
    if (!d) return '';
    const date = new Date(d.date);
    if (isNaN(date.getTime())) return '';
    const hh = date.getHours();
    const mm = date.getMinutes();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if (period === '1d') return `${pad(hh)}:${pad(mm)}`;
    if (period === '5d' || period === '1w') return `${pad(month)}/${pad(day)} ${pad(hh)}:${pad(mm)}`;
    return `${pad(month)}/${pad(day)}`;
  };

  return (
    <div className="space-y-4">
      {!initialSymbol && (
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
      )}

      <div className="p-5 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{displaySymbol}</h3>
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

        {!initialSymbol && (
          <div className="flex gap-1 p-0.5 rounded-lg bg-blue-50/40 dark:bg-slate-700/40 mb-4 overflow-x-auto">
            {PERIOD_CONFIG.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  period === p.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 text-right mb-2">
          Times: {tzLabel}
        </div>

        <div className={`overflow-x-auto ${!initialSymbol ? '' : ''}`}>
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto min-w-[500px]" preserveAspectRatio="xMidYMid meet">
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
                {formatXLabel(idx)}
              </text>
            ))}

            <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            <circle cx={xScale(data.length - 1)} cy={yScale(prices[prices.length - 1])} r="3" fill="#2563eb" />

            {hoveredIdx !== null && data[hoveredIdx] && (() => {
              const pointY = yScale(data[hoveredIdx].price);
              const nearTop = pointY < PAD.top + 50;
              const tipY = nearTop ? pointY + 14 : pointY - 44;
              const tipX = Math.max(PAD.left, Math.min(WIDTH - PAD.right - 96, xScale(hoveredIdx) - 48));
              const tipCX = Math.max(PAD.left + 48, Math.min(WIDTH - PAD.right - 48, xScale(hoveredIdx)));
              return (
                <g>
                  <line
                    x1={xScale(hoveredIdx)} y1={PAD.top}
                    x2={xScale(hoveredIdx)} y2={PAD.top + chartH}
                    stroke="#2563eb" strokeWidth="1" strokeDasharray="4 4"
                  />
                  <circle cx={xScale(hoveredIdx)} cy={pointY} r="4" fill="#2563eb" stroke="white" strokeWidth="2" />
                  <rect x={tipX} y={tipY} width="96" height="34" rx="4" className="fill-white dark:fill-zinc-800 stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="1" />
                  <text x={tipCX} y={tipY + 14} textAnchor="middle" className="fill-zinc-900 dark:fill-zinc-100 text-[11px] font-medium">
                    ${data[hoveredIdx].price.toFixed(2)}
                  </text>
                  <text x={tipCX} y={tipY + 27} textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[10px]">
                    {formatXLabel(hoveredIdx)}
                  </text>
                </g>
              );
            })()}

            <rect
              x={PAD.left} y={PAD.top}
              width={chartW} height={chartH}
              fill="transparent"
              onMouseMove={(e) => {
                const svgEl = e.currentTarget.closest('svg');
                if (!svgEl) return;
                const bbox = svgEl.getBoundingClientRect();
                const scaleX = WIDTH / bbox.width;
                const mouseX = (e.clientX - bbox.left) * scaleX - PAD.left;
                const idx = Math.round((mouseX / chartW) * (data.length - 1));
                setHoveredIdx(Math.max(0, Math.min(data.length - 1, idx)));
              }}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'crosshair' }}
            />
          </svg>
        </div>
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
