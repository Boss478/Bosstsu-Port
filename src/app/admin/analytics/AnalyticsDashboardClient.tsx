'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toBlob } from 'html-to-image';
import type { AnalyticsStats } from '@/app/actions/admin';

function formatNumber(n: number): string {
  return n.toLocaleString('th-TH');
}

function percentage(part: number, total: number): string {
  if (!total) return '0%';
  return `${((part / total) * 100).toFixed(1)}%`;
}

function exportCSV(stats: AnalyticsStats): void {
  const rows: string[] = ['type,name,count'];
  for (const p of stats.topPages) rows.push(`page,${p.path},${p.count}`);
  for (const e of stats.topEvents) rows.push(`event,${e.eventName},${e.count}`);
  for (const v of stats.viewsOverTime) rows.push(`view,${v.date},${v.views}`);
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const up = value > 0;
  return (
    <span className={`text-xs font-medium ml-1.5 ${up ? 'text-green-500' : 'text-red-400'}`}>
      {up ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  );
}

function TrafficVerticalChart({ data }: { data: { date: string; views: number }[] }) {
  const maxViews = Math.max(...data.map((d) => d.views), 1);

  return (
    <div className="flex items-end gap-[3px] h-64">
      {data.map((d, i) => {
        const h = (d.views / maxViews) * 100;
        const showLabel = i === 0 || i === data.length - 1 || i % 5 === 0;
        return (
          <div
            key={d.date}
            className="flex-1 flex flex-col items-center justify-end h-full group relative"
          >
            <div
              className="w-full bg-blue-500 dark:bg-blue-400 rounded-t transition-all hover:opacity-80 cursor-pointer"
              style={{ height: `${h}%`, minHeight: d.views > 0 ? 2 : 0 }}
              title={`${d.date} — ${formatNumber(d.views)} views`}
            />
            {showLabel && (
              <span className="text-[9px] text-zinc-400 mt-0.5 truncate w-full text-center leading-tight">
                {d.date.slice(5)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DeviceDonutChart({ data }: { data: { type: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <p className="text-zinc-400 text-sm">ยังไม่มีข้อมูล</p>;

  const colors: Record<string, string> = {
    desktop: '#3b82f6',
    mobile: '#10b981',
    tablet: '#8b5cf6',
  };
  const cx = 50,
    cy = 50,
    r = 35,
    sw = 12;
  const circ = 2 * Math.PI * r;

  const segments = data.reduce<
    { type: string; count: number; len: number; offset: number; pct: number }[]
  >((acc, d) => {
    const pct = d.count / total;
    const len = circ * pct;
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].len : 0;
    acc.push({ ...d, len, offset, pct });
    return acc;
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={sw} />
        {segments.map((s) => (
          <circle
            key={s.type}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={colors[s.type] || '#a1a1aa'}
            strokeWidth={sw}
            strokeDasharray={`${s.len} ${circ - s.len}`}
            strokeDashoffset={-s.offset}
            className="hover:opacity-80 cursor-pointer transition-opacity"
          >
            <title>
              {s.type}: {formatNumber(s.count)} ({percentage(s.count, total)})
            </title>
          </circle>
        ))}
      </svg>
      <div className="grid grid-cols-3 gap-3 text-xs">
        {segments.map((s) => (
          <div key={s.type} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: colors[s.type] || '#a1a1aa' }}
            />
            <span className="text-zinc-600 dark:text-zinc-400 capitalize">{s.type}</span>
            <span className="text-zinc-500 dark:text-zinc-500">{percentage(s.count, total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReferrerChart({ data }: { data: { referrer: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <p className="text-zinc-400 text-sm">ยังไม่มีข้อมูล</p>;
  return (
    <div className="space-y-2">
      {data.slice(0, 10).map((r) => {
        const w = total > 0 ? (r.count / total) * 100 : 0;
        return (
          <div key={r.referrer} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[60%]">
                {r.referrer === 'direct'
                  ? 'Direct'
                  : (() => {
                      try {
                        return new URL(r.referrer).hostname || r.referrer;
                      } catch {
                        return r.referrer;
                      }
                    })()}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 shrink-0 ml-2">
                {formatNumber(r.count)} ({percentage(r.count, total)})
              </span>
            </div>
            <div className="h-2 bg-zinc-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${w}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const DAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function DayOfWeekChart({ data }: { data: { date: string; views: number }[] }) {
  const counts = Array(7).fill(0);
  const dayCount = Array(7).fill(0);
  for (const d of data) {
    const day = new Date(d.date).getUTCDay();
    counts[day] += d.views;
    dayCount[day]++;
  }
  const avg = counts.map((c, i) => (dayCount[i] > 0 ? Math.round(c / dayCount[i]) : 0));
  const maxAvg = Math.max(...avg, 1);
  return (
    <div className="flex items-end gap-1.5 h-32">
      {avg.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{formatNumber(v)}</span>
          <div
            className="w-full bg-blue-400 dark:bg-blue-500 rounded-t transition-all"
            style={{ height: `${(v / maxAvg) * 100}%`, minHeight: v > 0 ? 4 : 0 }}
          />
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{DAY_LABELS[i]}</span>
        </div>
      ))}
    </div>
  );
}

function HourlyChart({ data }: { data: { hour: number; views: number }[] }) {
  const byHour = Array.from({ length: 24 }, (_, i) => {
    const found = data.find((d) => d.hour === i);
    return found ? found.views : 0;
  });
  const maxViews = Math.max(...byHour, 1);

  return (
    <div className="flex items-end gap-[2px] h-24">
      {byHour.map((v, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center justify-end h-full relative group"
        >
          <div
            className="w-full bg-cyan-400 dark:bg-cyan-500 rounded-t transition-all"
            style={{ height: `${(v / maxViews) * 100}%`, minHeight: v > 0 ? 2 : 0 }}
            title={`${i}:00 — ${formatNumber(v)} views`}
          />
        </div>
      ))}
    </div>
  );
}

function DonutChartCard({
  data,
  title,
  icon,
}: {
  data: { name: string; count: number }[];
  title: string;
  icon: string;
}) {
  if (data.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <i aria-hidden="true" className={`${icon} text-blue-500 text-base`} />
          {title}
        </h2>
        <p className="text-zinc-400 text-sm">รอข้อมูล (No data yet)</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);
  const colors = [
    '#3b82f6',
    '#10b981',
    '#8b5cf6',
    '#f59e0b',
    '#ef4444',
    '#ec4899',
    '#14b8a6',
    '#84cc16',
  ];
  const cx = 50,
    cy = 50,
    r = 35,
    sw = 12;
  const circ = 2 * Math.PI * r;

  const segments = data
    .slice(0, 8)
    .reduce<
      { name: string; count: number; len: number; offset: number; pct: number; color: string }[]
    >((acc, d, i) => {
      const pct = d.count / total;
      const len = circ * pct;
      const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].len : 0;
      acc.push({ ...d, len, offset, pct, color: colors[i % colors.length] });
      return acc;
    }, []);

  return (
    <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
        <i aria-hidden="true" className={`${icon} text-blue-500 text-base`} />
        {title}
      </h2>
      <div className="flex flex-col items-center gap-3">
        <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={sw} />
          {segments.map((s) => (
            <circle
              key={s.name}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={sw}
              strokeDasharray={`${s.len} ${circ - s.len}`}
              strokeDashoffset={-s.offset}
              className="hover:opacity-80 cursor-pointer transition-opacity"
            >
              <title>
                {s.name}: {formatNumber(s.count)} ({percentage(s.count, total)})
              </title>
            </circle>
          ))}
        </svg>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs w-full">
          {segments.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-zinc-600 dark:text-zinc-400 truncate">{s.name}</span>
              <span className="text-zinc-500 dark:text-zinc-500 ml-auto">
                {percentage(s.count, total)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModelBarChart({ data }: { data: { name: string; count: number }[] }) {
  if (data.length === 0) return <p className="text-zinc-400 text-sm">รอข้อมูล (No data yet)</p>;
  const top = data.slice(0, 10);
  const maxCount = Math.max(...top.map((d) => d.count), 1);
  return (
    <div className="space-y-2">
      {top.map((d) => (
        <div key={d.name} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[65%]">{d.name}</span>
            <span className="text-zinc-500 dark:text-zinc-400 shrink-0 ml-2">
              {formatNumber(d.count)}
            </span>
          </div>
          <div className="h-2 bg-zinc-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all"
              style={{ width: `${(d.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const INTERVAL_OPTIONS = [3, 5, 10, 15, 30, 60];
const INTERVAL_STORAGE_KEY = 'boss478-analytics-refresh-interval';

export default function AnalyticsDashboardClient({
  stats: initialStats,
}: {
  stats: AnalyticsStats;
}) {
  const [stats, setStats] = useState(initialStats);
  const [refreshing, setRefreshing] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<'jpg' | 'png' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const exportBtnRef = useRef<HTMLDivElement>(null);
  const [intervalSec, setIntervalSec] = useState(10);

  const filledTrafficData = useMemo(() => {
    const today = new Date();
    const days: { date: string; views: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const found = stats.viewsOverTime.find((r) => r.date === dateStr);
      days.push({ date: dateStr, views: found?.views ?? 0 });
    }
    return days;
  }, [stats.viewsOverTime]);

  const activeTrafficDays = filledTrafficData.filter((d) => d.views > 0).length;

  useEffect(() => {
    const stored = localStorage.getItem(INTERVAL_STORAGE_KEY);
    if (stored) setIntervalSec(Number(stored));
  }, []);

  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/admin/analytics/api/data');
      if (res.ok) {
        const data = (await res.json()) as AnalyticsStats;
        setStats(data);
        setLastUpdated(new Date());
      }
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleExportImage = useCallback(async (format: 'jpg' | 'png') => {
    if (!exportRef.current) return;
    setExportOpen(false);
    setExporting(format);
    try {
      const blob = await toBlob(exportRef.current, { quality: 0.92, pixelRatio: 2 });
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setExporting(null);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(INTERVAL_STORAGE_KEY, String(intervalSec));
  }, [intervalSec]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let active = true;

    function schedule(ms: number) {
      timer = setTimeout(async () => {
        if (!active) return;
        await refresh();
        if (active) schedule(isFocused() ? intervalSec * 1000 : Math.min(30, intervalSec) * 1000);
      }, ms);
    }

    function isFocused() {
      return !document.hidden;
    }

    function onVisibility() {
      clearTimeout(timer);
      schedule(isFocused() ? intervalSec * 1000 : Math.min(30, intervalSec) * 1000);
    }

    schedule(intervalSec * 1000);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh, intervalSec]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportBtnRef.current && !exportBtnRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    if (exportOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [exportOpen]);

  const total = stats.totalViews;
  const todayViews = stats.trends.todayViews;
  const todayVisitors = stats.today
    ? ((stats.today as { uniqueVisitors?: number }).uniqueVisitors ?? 0)
    : 0;

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950">
      <section className="pt-8 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
              <i aria-hidden="true" className="fi fi-sr-stats text-blue-500 mr-3" />
              Analytics Dashboard
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Auto:</span>
                <select
                  value={intervalSec}
                  onChange={(e) => setIntervalSec(Number(e.target.value))}
                  className="px-2 py-1.5 rounded-xl border border-zinc-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 text-zinc-700 dark:text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {INTERVAL_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}s
                    </option>
                  ))}
                </select>
                <span
                  className={`w-2 h-2 rounded-full ${refreshing ? 'bg-green-500 animate-pulse' : 'bg-green-400'}`}
                />
                <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                  Updated: {lastUpdated ? lastUpdated.toLocaleTimeString('th-TH') : '...'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={refresh}
                  disabled={refreshing}
                  className="px-3 py-1.5 text-sm rounded-xl border border-zinc-300 dark:border-slate-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <i
                    aria-hidden="true"
                    className={`fi fi-sr-refresh text-xs ${refreshing ? 'animate-spin' : ''}`}
                  />
                  รีเฟรช
                </button>
                <div className="relative" ref={exportBtnRef}>
                  <button
                    onClick={() => setExportOpen(!exportOpen)}
                    disabled={exporting !== null}
                    className="px-3 py-1.5 text-sm rounded-xl border border-zinc-300 dark:border-slate-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <i aria-hidden="true" className="fi fi-sr-download text-xs" />
                    {exporting ? 'Exporting...' : 'Export'}
                  </button>
                  {exportOpen && (
                    <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-xl border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
                      <button
                        onClick={() => {
                          setExportOpen(false);
                          exportCSV(stats);
                        }}
                        className="w-full px-3 py-2 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <i
                          aria-hidden="true"
                          className="fi fi-sr-file-csv text-xs text-green-500"
                        />
                        CSV
                      </button>
                      <button
                        onClick={() => handleExportImage('jpg')}
                        className="w-full px-3 py-2 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <i aria-hidden="true" className="fi fi-sr-images text-xs text-blue-500" />
                        JPG
                      </button>
                      <button
                        onClick={() => handleExportImage('png')}
                        className="w-full px-3 py-2 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <i aria-hidden="true" className="fi fi-sr-images text-xs text-purple-500" />
                        PNG
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div id="analytics-export-area" ref={exportRef}>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <SummaryCard
                label="Total Views"
                value={formatNumber(total)}
                trend={stats.trends.changePercent}
              />
              <SummaryCard label="Total Events" value={formatNumber(stats.totalEvents)} />
              <SummaryCard
                label="Today Views"
                value={formatNumber(todayViews)}
                trend={stats.trends.changePercent}
              />
              <SummaryCard label="Today Visitors" value={formatNumber(todayVisitors)} />
            </div>

            {/* Daily Traffic */}
            <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <i aria-hidden="true" className="fi fi-sr-arrow-trend-up text-blue-500 text-base" />
                Daily Traffic ({activeTrafficDays} of 30 Days)
              </h2>
              {stats.viewsOverTime.length > 0 ? (
                <TrafficVerticalChart data={filledTrafficData} />
              ) : (
                <p className="text-zinc-400 text-sm">ยังไม่มีข้อมูล</p>
              )}
            </div>

            {/* Time Distribution */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i aria-hidden="true" className="fi fi-sr-calendar text-blue-500 text-base" />
                  วันในสัปดาห์
                </h2>
                {stats.viewsOverTime.length > 0 ? (
                  <DayOfWeekChart data={stats.viewsOverTime} />
                ) : (
                  <p className="text-zinc-400 text-sm">ยังไม่มีข้อมูล</p>
                )}
              </div>

              <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i aria-hidden="true" className="fi fi-sr-clock text-blue-500 text-base" />
                  ชั่วโมงในแต่ละวัน
                </h2>
                {stats.hourlyDistribution.length > 0 ? (
                  <div>
                    <HourlyChart data={stats.hourlyDistribution} />
                    <div
                      className="flex justify-between text-[10px] text-zinc-400 mt-1"
                      style={{ paddingLeft: '36px' }}
                    >
                      <span>0:00</span>
                      <span>6:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                      <span>23:00</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-400 text-sm">ยังไม่มีข้อมูล</p>
                )}
              </div>
            </div>

            {/* Rich Data Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Device Breakdown */}
              <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i aria-hidden="true" className="fi fi-sr-stats text-blue-500 text-base" />
                  อุปกรณ์ (Device)
                </h2>
                <DeviceDonutChart data={stats.deviceBreakdown} />
              </div>

              {/* Referrer Breakdown */}
              <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i aria-hidden="true" className="fi fi-sr-link text-blue-500 text-base" />
                  แหล่งที่มา (Referrer)
                </h2>
                <ReferrerChart data={stats.referrerBreakdown} />
              </div>

              {/* Top Pages */}
              <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i aria-hidden="true" className="fi fi-sr-file text-blue-500 text-base" />
                  หน้าที่ยอดนิยม
                </h2>
                {stats.topPages.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topPages.map((p) => (
                      <div key={p.path} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[70%]">
                          {p.path}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400 shrink-0 ml-2">
                          {formatNumber(p.count)} ({percentage(p.count, total)})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 text-sm">ยังไม่มีข้อมูล</p>
                )}
              </div>

              {/* Top Events */}
              <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i aria-hidden="true" className="fi fi-sr-bolt text-blue-500 text-base" />
                  อีเวนท์ยอดนิยม
                </h2>
                {stats.topEvents.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topEvents.map((e) => (
                      <div key={e.eventName} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-700 dark:text-zinc-300">{e.eventName}</span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {formatNumber(e.count)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 text-sm">ยังไม่มีข้อมูล</p>
                )}
              </div>
            </div>

            {/* OS/Device Model Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <DonutChartCard
                data={stats.osBreakdown}
                title="ระบบปฏิบัติการ (OS)"
                icon="fi fi-sr-layer-plus"
              />
              <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  รุ่นอุปกรณ์ (Device Models)
                </h2>
                <ModelBarChart data={stats.deviceModelBreakdown} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, trend }: { label: string; value: string; trend?: number }) {
  return (
    <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center">
        {value}
        {trend !== undefined && <TrendBadge value={trend} />}
      </p>
    </div>
  );
}
