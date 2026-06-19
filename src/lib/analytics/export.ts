import type { AnalyticsStats } from '@/app/actions/admin';

export function exportCSV(stats: AnalyticsStats): void {
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
