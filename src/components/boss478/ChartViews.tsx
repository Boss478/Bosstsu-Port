'use client';

import { useState, useMemo } from 'react';
import { useStockData, PERIOD_CONFIG, type StockHistory } from './StockDataContext';
import PriceChart from './PriceChart';
import StockDetailModal from './StockDetailModal';

type ChartViewMode = 'compact' | 'watchlist' | 'all' | 'full';
type CompactCols = 3 | 4 | 6;

const VIEW_MODES: { id: ChartViewMode; label: string }[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'all', label: 'All' },
  { id: 'full', label: 'Full' },
];

const DEFAULT_SELECTED = [
  'PTT.BK', 'AOT.BK', 'CPALL.BK', 'ADVANC.BK', 'KBANK.BK',
  'PTTEP.BK', 'SCB.BK',
];

export default function ChartViews() {
  const { stocks, history, period, setPeriod, watchlist } = useStockData();
  const [viewMode, setViewMode] = useState<ChartViewMode>('full');
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(DEFAULT_SELECTED);
  const [fullSymbol, setFullSymbol] = useState(stocks[0]?.symbol ?? '');
  const [modalSymbol, setModalSymbol] = useState<string | null>(null);
  const [compactCols, setCompactCols] = useState<CompactCols>(4);
  const [watchlistSelected, setWatchlistSelected] = useState<string[]>(DEFAULT_SELECTED);

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

  const displaySymbols = ((): string[] => {
    switch (viewMode) {
      case 'compact': return selectedSymbols;
      case 'watchlist': return watchlistSelected;
      case 'all': return [...new Set([...selectedSymbols, ...watchlist])];
      case 'full': return [fullSymbol];
    }
  })();

  const toggleSelected = (symbol: string) => {
    setSelectedSymbols(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const toggleWatchlistSelected = (symbol: string) => {
    setWatchlistSelected(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const allSymbols = stocks.map(s => s.symbol);

  if (stocks.length === 0) {
    return (
      <div className="p-8 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm text-center">
        <p className="text-zinc-500 dark:text-zinc-400">No stock data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-0.5 rounded-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 w-fit">
        {VIEW_MODES.map(m => (
          <button
            key={m.id}
            onClick={() => {
              setViewMode(m.id);
              if (m.id === 'full' && !selectedSymbols.includes(fullSymbol) && selectedSymbols.length > 0) {
                setFullSymbol(selectedSymbols[0]);
              }
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              viewMode === m.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1 p-0.5 rounded-lg bg-blue-50/40 dark:bg-slate-700/40 overflow-x-auto">
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

      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 text-right">
        Times: {tzLabel}
      </div>

      {viewMode === 'compact' && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Cols:</span>
            {([3, 4, 6] as CompactCols[]).map(n => (
              <button
                key={n}
                onClick={() => setCompactCols(n)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  compactCols === n
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/50 text-zinc-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <span className="text-xs text-zinc-300 dark:text-zinc-600 hidden sm:inline">|</span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 self-center">Selected:</span>
          <div className="flex flex-wrap gap-1">
            {allSymbols.map(s => (
              <button
                key={s}
                onClick={() => toggleSelected(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedSymbols.includes(s)
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/50 text-zinc-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'watchlist' && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 self-center">Selected:</span>
          <div className="flex flex-wrap gap-1">
            {allSymbols.map(s => (
              <button
                key={s}
                onClick={() => toggleWatchlistSelected(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  watchlistSelected.includes(s)
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/50 text-zinc-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'all' && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 self-center">Showing:</span>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-300/50 dark:border-blue-700/50 cursor-default">
            {selectedSymbols.length} selected
          </button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600/20 text-amber-600 dark:text-amber-400 border border-amber-300/50 dark:border-amber-700/50 cursor-default">
            {watchlist.length} watchlisted
          </button>
        </div>
      )}

      {viewMode !== 'full' && displaySymbols.length === 0 && (
        <div className="p-8 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            {viewMode === 'compact' ? 'No symbols selected. Toggle symbols above to add them.' :
             viewMode === 'watchlist' ? 'No symbols selected. Toggle symbols above to add them.' :
             'No symbols to display.'}
          </p>
        </div>
      )}

      {viewMode !== 'full' && displaySymbols.length > 0 && (
        <div className={`grid gap-4 ${
          viewMode === 'compact'
            ? compactCols === 6 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' :
              compactCols === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' :
          viewMode === 'watchlist' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1 sm:grid-cols-2'
        }`}>
          {displaySymbols.map(sym => {
            const stock = stocks.find(s => s.symbol === sym);
            const data = history[sym] ?? [];
            if (!stock) return null;
            return (
              <MiniChartCard
                key={sym}
                symbol={sym}
                data={data}
                stock={stock}
                onClick={() => setModalSymbol(sym)}
                period={period}
              />
            );
          })}
        </div>
      )}

      {viewMode === 'full' && (
        <>
          <div className="flex flex-wrap gap-2">
            {allSymbols.slice(0, 10).map(s => (
              <button
                key={s}
                onClick={() => {
                  setFullSymbol(s);
                  setViewMode('full');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  fullSymbol === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/50 text-zinc-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <PriceChart initialSymbol={fullSymbol} />
        </>
      )}

      {modalSymbol && (
        <StockDetailModal
          symbol={modalSymbol}
          onClose={() => setModalSymbol(null)}
        />
      )}
    </div>
  );
}

function MiniChartCard({
  symbol,
  data,
  stock,
  onClick,
  period,
}: {
  symbol: string;
  data: StockHistory[];
  stock: { symbol: string; name: string; price: number; change: number; changePercent: number; open: number; regularMarketDayHigh: number; regularMarketDayLow: number; marketCap: number };
  onClick: () => void;
  period?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const prices = data.map(d => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const changePositive = stock.change >= 0;

  const W = 200;
  const H = 60;
  const PT = 2;
  const PR = 2;
  const PB = 2;
  const PL = 2;
  const cw = W - PL - PR;
  const ch = H - PT - PB;

  const xS = (i: number) => PL + (i / (data.length - 1)) * cw;
  const yS = (v: number) => PT + ch - ((v - min) / range) * ch;
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xS(i).toFixed(1)},${yS(d.price).toFixed(1)}`).join('');
  const areaPath = `${path}L${xS(data.length - 1)},${PT + ch}L${xS(0)},${PT + ch}Z`;

  const strokeColor = changePositive ? '#2563eb' : '#dc2626';
  const gradientId = `spark-grad-${symbol}`;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const formatYLabel = (price: number) => {
    if (range >= 100) return price.toFixed(0);
    if (range >= 10) return price.toFixed(1);
    return price.toFixed(2);
  };

  const formatHoverLabel = (idx: number) => {
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

  const formatCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toFixed(0)}`;
  };

  return (
    <div className="p-4 rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm text-left w-full relative">
      <button
        onClick={onClick}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all cursor-pointer z-10"
        title="View details"
      >
        <i className="fi fi-sr-expand text-xs text-zinc-600 dark:text-zinc-400" />
      </button>

      <div className="flex items-center justify-between mb-2 pr-8">
        <div className="min-w-0">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{symbol}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[100px]">{stock.name}</p>
        </div>
        <div className="text-right shrink-0 ml-2">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">${stock.price.toFixed(2)}</p>
          <p className={`text-xs font-medium flex items-center gap-0.5 justify-end ${
            changePositive ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
          }`}>
            <i className={`fi ${changePositive ? 'fi-sr-caret-up' : 'fi-sr-caret-down'} text-[10px]`} />
            {changePositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </p>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {data.length >= 2 ? (
          <>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.12" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {range > 0 && (
          <g>
            {[max, (max + min) / 2, min].map((p, i) => {
              const y = yS(p);
              const label = formatYLabel(p);
              const labelX = PL + 3;
              const labelW = label.length * 5;
              return (
                <g key={i}>
                  <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.5" strokeDasharray="2 2" />
                  <rect x={labelX - 1} y={y - 4} width={labelW + 2} height="9" rx="1" fill="white" opacity="0.7" />
                  <text x={labelX} y={y + 3} textAnchor="start" fill="currentColor" opacity="0.6" fontSize="7" fontFamily="monospace">
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={xS(data.length - 1)} cy={yS(prices[prices.length - 1])} r="2" fill={strokeColor} />

        {hoveredIdx !== null && data[hoveredIdx] && (() => {
          const d = data[hoveredIdx];
          const y = yS(d.price);
          const nearTop = y < 28;
          const tipY = nearTop ? y + 8 : y - 34;
          const tipX = Math.max(PL, Math.min(W - PR - 72, xS(hoveredIdx) - 36));
          return (
            <g>
              <line x1={xS(hoveredIdx)} y1={PT} x2={xS(hoveredIdx)} y2={PT + ch} stroke={strokeColor} strokeWidth="0.5" strokeDasharray="2 2" />
              <circle cx={xS(hoveredIdx)} cy={y} r="2.5" fill={strokeColor} stroke="white" strokeWidth="1" />
              <rect x={tipX} y={tipY} width="72" height="28" rx="4" fill={strokeColor} opacity="0.9" />
              <text x={tipX + 36} y={tipY + 12} textAnchor="middle" fill="white" fontSize="9" fontWeight="600">
                ${d.price.toFixed(2)}
              </text>
              <text x={tipX + 36} y={tipY + 23} textAnchor="middle" fill="white" fontSize="7" opacity="0.8">
                {formatHoverLabel(hoveredIdx)}
              </text>
            </g>
          );
        })()}

        <rect
          x={PL} y={PT}
          width={cw} height={ch}
          fill="transparent"
          onMouseMove={(e) => {
            const svgEl = e.currentTarget.closest('svg');
            if (!svgEl) return;
            const bbox = svgEl.getBoundingClientRect();
            const scaleX = W / bbox.width;
            const mouseX = (e.clientX - bbox.left) * scaleX - PL;
            const idx = Math.round((mouseX / cw) * (data.length - 1));
            setHoveredIdx(Math.max(0, Math.min(data.length - 1, idx)));
          }}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{ cursor: 'crosshair' }}
        />
        </>
        ) : (
          <text x={W / 2} y={H / 2} textAnchor="middle" fill="#a1a1aa" fontSize="9">
            No chart data
          </text>
        )}
      </svg>

      <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 mt-2.5 text-[11px]">
        <span className="text-zinc-400 dark:text-zinc-500">O</span>
        <span className="text-zinc-400 dark:text-zinc-500">H</span>
        <span className="text-zinc-400 dark:text-zinc-500">Chg</span>
        <span className="text-zinc-800 dark:text-zinc-200 font-medium">${stock.open.toFixed(2)}</span>
        <span className="text-zinc-800 dark:text-zinc-200 font-medium">${stock.regularMarketDayHigh.toFixed(2)}</span>
        <span className={`font-medium ${stock.change >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
        </span>
        <span className="text-zinc-400 dark:text-zinc-500">C</span>
        <span className="text-zinc-400 dark:text-zinc-500">L</span>
        <span className="text-zinc-400 dark:text-zinc-500">Mkt</span>
        <span className="text-zinc-800 dark:text-zinc-200 font-medium">${stock.price.toFixed(2)}</span>
        <span className="text-zinc-800 dark:text-zinc-200 font-medium">${stock.regularMarketDayLow.toFixed(2)}</span>
        <span className="text-zinc-800 dark:text-zinc-200 font-medium">{formatCap(stock.marketCap)}</span>
      </div>
    </div>
  );
}
