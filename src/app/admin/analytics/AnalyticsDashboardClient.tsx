'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toBlob } from 'html-to-image';
import type { AnalyticsStats } from '@/app/actions/admin';
import { formatNumber } from '@/lib/analytics/format';
import { exportCSV } from '@/lib/analytics/export';
import {
  TrafficVerticalChart,
  DeviceDonutChart,
  ReferrerChart,
  DayOfWeekChart,
  HourlyChart,
  DonutChartCard,
  ModelBarChart,
  SummaryCard,
} from '@/components/charts';
import GlassCard from '@/components/GlassCard';

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
                    <option key={s} value={s}>{s}s</option>
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
                  <i aria-hidden="true" className={`fi fi-sr-refresh text-xs ${refreshing ? 'animate-spin' : ''}`} />
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
                        onClick={() => { setExportOpen(false); exportCSV(stats); }}
                        className="w-full px-3 py-2 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      >
                        <i aria-hidden="true" className="fi fi-sr-file-csv text-xs text-green-500" />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <SummaryCard label="Total Views" value={formatNumber(total)} trend={stats.trends.changePercent} />
              <SummaryCard label="Total Events" value={formatNumber(stats.totalEvents)} />
              <SummaryCard label="Today Views" value={formatNumber(todayViews)} trend={stats.trends.changePercent} />
              <SummaryCard label="Today Visitors" value={formatNumber(todayVisitors)} />
            </div>

            <GlassCard className="mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <i aria-hidden="true" className="fi fi-sr-arrow-trend-up text-blue-500 text-base" />
                Daily Traffic ({activeTrafficDays} of 30 Days)
              </h2>
              {stats.viewsOverTime.length > 0 ? (
                <TrafficVerticalChart data={filledTrafficData} />
              ) : (
                <p className="text-zinc-400 text-sm">ยังไม่มีข้อมูล</p>
              )}
            </GlassCard>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <GlassCard>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i aria-hidden="true" className="fi fi-sr-calendar text-blue-500 text-base" />
                  วันในสัปดาห์
                </h2>
                {stats.viewsOverTime.length > 0 ? (
                  <DayOfWeekChart data={stats.viewsOverTime} />
                ) : (
                  <p className="text-zinc-400 text-sm">ยังไม่มีข้อมูล</p>
                )}
              </GlassCard>

              <GlassCard>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i aria-hidden="true" className="fi fi-sr-clock text-blue-500 text-base" />
                  ชั่วโมงในแต่ละวัน
                </h2>
                {stats.hourlyDistribution.length > 0 ? (
                  <div>
                    <HourlyChart data={stats.hourlyDistribution} />
                    <div className="flex gap-[2px] mt-1">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const showLabel = i === 0 || i === 6 || i === 12 || i === 18 || i === 23;
                        return (
                          <div key={i} className="flex-1 text-center">
                            {showLabel && (
                              <span className="text-[9px] text-zinc-400 leading-tight block">{i}:00</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-400 text-sm">ยังไม่มีข้อมูล</p>
                )}
              </GlassCard>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <GlassCard>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i aria-hidden="true" className="fi fi-sr-stats text-blue-500 text-base" />
                  อุปกรณ์ (Device)
                </h2>
                <DeviceDonutChart data={stats.deviceBreakdown} />
              </GlassCard>

              <GlassCard>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i aria-hidden="true" className="fi fi-sr-link text-blue-500 text-base" />
                  แหล่งที่มา (Referrer)
                </h2>
                <ReferrerChart data={stats.referrerBreakdown} />
              </GlassCard>

              <GlassCard>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i aria-hidden="true" className="fi fi-sr-file text-blue-500 text-base" />
                  หน้าที่ยอดนิยม
                </h2>
                {stats.topPages.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topPages.map((p) => (
                      <div key={p.path} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[70%]">{p.path}</span>
                        <span className="text-zinc-500 dark:text-zinc-400 shrink-0 ml-2">
                          {formatNumber(p.count)} ({((p.count / total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 text-sm">ยังไม่มีข้อมูล</p>
                )}
              </GlassCard>

              <GlassCard>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i aria-hidden="true" className="fi fi-sr-bolt text-blue-500 text-base" />
                  อีเวนท์ยอดนิยม
                </h2>
                {stats.topEvents.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topEvents.map((e) => (
                      <div key={e.eventName} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-700 dark:text-zinc-300">{e.eventName}</span>
                        <span className="text-zinc-500 dark:text-zinc-400">{formatNumber(e.count)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 text-sm">ยังไม่มีข้อมูล</p>
                )}
              </GlassCard>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <DonutChartCard data={stats.osBreakdown} title="ระบบปฏิบัติการ (OS)" icon="fi fi-sr-layer-plus" />
              <GlassCard>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  รุ่นอุปกรณ์ (Device Models)
                </h2>
                <ModelBarChart data={stats.deviceModelBreakdown} />
              </GlassCard>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
