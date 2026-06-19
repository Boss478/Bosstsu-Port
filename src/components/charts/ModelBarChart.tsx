'use client';

import { formatNumber } from '@/lib/analytics/format';

export default function ModelBarChart({ data }: { data: { name: string; count: number }[] }) {
  if (data.length === 0) return <p className="text-zinc-400 text-sm">รอข้อมูล (No data yet)</p>;
  const top = data.slice(0, 10);
  const maxCount = Math.max(...top.map((d) => d.count), 1);
  return (
    <div className="space-y-2">
      {top.map((d) => (
        <div key={d.name} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[65%]">{d.name}</span>
            <span className="text-zinc-500 dark:text-zinc-400 shrink-0 ml-2">{formatNumber(d.count)}</span>
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
