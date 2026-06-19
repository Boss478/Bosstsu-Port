'use client';

import { formatNumber, percentage } from '@/lib/analytics/format';

export default function ReferrerChart({ data }: { data: { referrer: string; count: number }[] }) {
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
                      try { return new URL(r.referrer).hostname || r.referrer; }
                      catch { return r.referrer; }
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
