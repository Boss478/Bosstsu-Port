'use client';

/**
 * KruLAW — amendment-history timeline (FR9), shown in the law header.
 *
 * Presentational leaf: renders `editions[]` as a vertical timeline
 * (ฉบับที่ N + ประกาศ date + effective date + note). Dates are Buddhist-era
 * strings (e.g. 2550-08-15) from the frozen LawDoc shape and are displayed
 * verbatim — converting them via `new Date()` would shift the year to CE.
 *
 * Input order: ascending by edition no (ฉ.1 = original act). The component
 * renders exactly what it receives; pass a reversed copy if a descending
 * display is ever wanted.
 */
import type { EditionTimelineProps } from '@/app/(website)/krulaw/lib/reader-props';

export function EditionTimeline({ editions }: EditionTimelineProps) {
  if (editions.length === 0) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">ไม่มีข้อมูลฉบับที่ประกาศใช้</p>;
  }

  return (
    <ol
      className="krulaw-timeline ml-2 space-y-5 border-l-2 border-blue-200 dark:border-slate-700"
      aria-label="ประวัติการประกาศใช้และแก้ไขเพิ่มเติม"
    >
      {editions.map((ed) => (
        <li key={ed.no} className="relative pl-6">
          <span
            aria-hidden="true"
            className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-500 ring-1 ring-blue-200 dark:border-slate-900 dark:ring-slate-700"
          />
          <p className="text-sm font-semibold leading-relaxed text-zinc-800 dark:text-zinc-100">
            ฉบับที่ {ed.no}
            {ed.note ? (
              <span className="ml-2 font-normal text-zinc-600 dark:text-zinc-400">{ed.note}</span>
            ) : null}
          </p>
          <dl className="mt-1 space-y-0.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
            <div className="flex gap-2">
              <dt className="shrink-0 text-zinc-600 dark:text-zinc-400">ประกาศในราชกิจจานุเบกษา</dt>
              <dd>{ed.gazetteDate}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-zinc-600 dark:text-zinc-400">มีผลใช้บังคับ</dt>
              <dd>{ed.effectiveDate}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ol>
  );
}
