'use client';

import { formatNumber } from '@/lib/analytics/format';

export default function TrafficVerticalChart({ data }: { data: { date: string; views: number }[] }) {
  const maxViews = Math.max(...data.map((d) => d.views), 1);

  return (
    <div>
      <div className="flex items-end gap-[3px] h-64">
        {data.map((d) => {
          const h = (d.views / maxViews) * 100;
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
            </div>
          );
        })}
      </div>
      <div className="flex gap-[3px] mt-0.5">
        {data.map((d, i) => {
          const showLabel = i === 0 || i === data.length - 1 || i % 5 === 0;
          return (
            <div key={d.date} className="flex-1 text-center">
              {showLabel && (
                <span className="text-[9px] text-zinc-400 truncate leading-tight block">
                  {d.date.slice(5)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
