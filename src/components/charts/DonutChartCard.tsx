'use client';

import { formatNumber, percentage } from '@/lib/analytics/format';
import GlassCard from '@/components/GlassCard';

export default function DonutChartCard({
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
      <GlassCard variant="card">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <i aria-hidden="true" className={`${icon} text-blue-500 text-base`} />
          {title}
        </h2>
        <p className="text-zinc-400 text-sm">รอข้อมูล (No data yet)</p>
      </GlassCard>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);
  const colors = [
    '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
    '#ef4444', '#ec4899', '#14b8a6', '#84cc16',
  ];
  const cx = 50, cy = 50, r = 35, sw = 12;
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
    <GlassCard variant="card">
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
              cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={sw}
              strokeDasharray={`${s.len} ${circ - s.len}`}
              strokeDashoffset={-s.offset}
              className="hover:opacity-80 cursor-pointer transition-opacity"
            >
              <title>{s.name}: {formatNumber(s.count)} ({percentage(s.count, total)})</title>
            </circle>
          ))}
        </svg>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs w-full">
          {segments.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-zinc-600 dark:text-zinc-400 truncate">{s.name}</span>
              <span className="text-zinc-500 dark:text-zinc-500 ml-auto">{percentage(s.count, total)}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
