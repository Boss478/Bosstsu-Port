'use client';

import { formatNumber } from '@/lib/analytics/format';

const DAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function DayOfWeekChart({ data }: { data: { date: string; views: number }[] }) {
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
