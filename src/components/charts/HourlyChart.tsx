'use client';

import { formatNumber } from '@/lib/analytics/format';

export default function HourlyChart({ data }: { data: { hour: number; views: number }[] }) {
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
