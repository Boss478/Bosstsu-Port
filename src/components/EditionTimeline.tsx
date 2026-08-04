'use client';

import { useState } from 'react';
import type { EditionTimelineProps } from '@/app/(website)/lawlib/lib/reader-props';
import { formatThaiBEDate } from '@/lib/lawlib/format';

/**
 * LawLib — amendment-history timeline (FR9), shown in the law header.
 *
 * COLLAPSED by default: the always-expanded ~280px timeline pushed the
 * reading column below the fold, so this renders as a one-line disclosure
 * ("ประวัติการแก้ไข (N ฉบับ)") that expands the full vertical timeline on
 * demand. `.lawlib-timeline` stays on the root so print CSS hides it.
 *
 * Dates are Buddhist-era strings (e.g. 2550-08-15) from the frozen LawDoc
 * shape; formatThaiBEDate renders them with Thai month names and NO CE→BE
 * shift (the year is already BE).
 *
 * Input order: ascending by edition no (ฉ.1 = original act). The component
 * renders exactly what it receives; pass a reversed copy if a descending
 * display is ever wanted.
 */
export function EditionTimeline({ editions }: EditionTimelineProps) {
  const [open, setOpen] = useState(false);

  if (editions.length === 0) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">ไม่มีข้อมูลฉบับที่ประกาศใช้</p>;
  }

  return (
    <div className="lawlib-timeline">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="lawlib-edition-timeline-list"
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-blue-300"
      >
        <i aria-hidden="true" className="fi fi-sr-clock text-xs text-slate-400" />
        ประวัติการแก้ไข ({editions.length} ฉบับ)
        <i
          aria-hidden="true"
          className={`fi fi-sr-angle-small-down text-xs transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ol
          id="lawlib-edition-timeline-list"
          aria-label="ประวัติการประกาศใช้และแก้ไขเพิ่มเติม"
          className="mt-3 ml-2 space-y-5 border-l-2 border-blue-200 dark:border-slate-700"
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
                  <span className="ml-2 font-normal text-zinc-600 dark:text-zinc-400">
                    {ed.note}
                  </span>
                ) : null}
              </p>
              <dl className="mt-1 space-y-0.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                <div className="flex gap-2">
                  <dt className="shrink-0 text-zinc-600 dark:text-zinc-400">
                    ประกาศในราชกิจจานุเบกษา
                  </dt>
                  <dd>{formatThaiBEDate(ed.gazetteDate)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 text-zinc-600 dark:text-zinc-400">มีผลใช้บังคับ</dt>
                  <dd>{formatThaiBEDate(ed.effectiveDate)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
