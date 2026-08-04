'use client';

/**
 * KruLAW — มาตรา definitions glossary (FR8).
 *
 * Controlled leaf: lists every definition (term + definition). Clicking a
 * term fires `onTerm(term)` — the reader core decides what to do (e.g. jump
 * to มาตรา 1 / highlight). Sticky header, scrollable list: the header sits
 * outside the scroll region of a flex column.
 */
import type { GlossaryPanelProps } from '@/app/(website)/krulaw/lib/reader-props';

export function GlossaryPanel({ definitions, onTerm, missingTerms }: GlossaryPanelProps) {
  return (
    <section className="krulaw-panel flex flex-col overflow-hidden" aria-label="บทนิยาม">
      <header className="flex items-baseline justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">บทนิยาม</h2>
        <span className="text-xs text-zinc-600 dark:text-zinc-400">{definitions.length} คำ</span>
      </header>

      {definitions.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          ไม่มีบทนิยามในกฎหมายฉบับนี้
        </p>
      ) : (
        <ul className="max-h-80 flex-1 divide-y divide-slate-200 overflow-y-auto dark:divide-slate-700">
          {definitions.map((d) => {
            const missing = missingTerms?.has(d.term) ?? false;
            return (
              <li key={d.term}>
                <button
                  type="button"
                  disabled={missing}
                  aria-disabled={missing}
                  title={missing ? 'ไม่พบคำนี้ในเนื้อหา' : undefined}
                  onClick={() => onTerm(d.term)}
                  className={`block w-full px-4 py-3 text-left transition-colors focus:outline-none ${
                    missing
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:bg-blue-50/70 focus-visible:bg-blue-50/70 dark:hover:bg-slate-800/70 dark:focus-visible:bg-slate-800/70'
                  }`}
                >
                  <span
                    className={`text-sm font-semibold ${missing ? 'text-zinc-500 dark:text-zinc-400' : 'text-blue-700 dark:text-blue-300'}`}
                  >
                    {d.term}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {d.definition}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
