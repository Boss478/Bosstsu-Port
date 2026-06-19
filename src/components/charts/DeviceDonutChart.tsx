'use client';

import { formatNumber, percentage } from '@/lib/analytics/format';

export default function DeviceDonutChart({ data }: { data: { type: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <p className="text-zinc-400 text-sm">ยังไม่มีข้อมูล</p>;

  const colors: Record<string, string> = {
    desktop: '#3b82f6',
    mobile: '#10b981',
    tablet: '#8b5cf6',
  };
  const cx = 50, cy = 50, r = 35, sw = 12;
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
            <title>{s.type}: {formatNumber(s.count)} ({percentage(s.count, total)})</title>
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
