'use client';

/**
 * LawLib — table of contents sidebar (FR2 + FR7).
 *
 *  - หมวด/มาตรา nav tree (sections nested), scroll-spy via IntersectionObserver
 *  - prev/next มาตรา buttons (global article order incl. sections)
 *  - jump box: accepts "60" / "มาตรา 60" / "มาตรา 60 ทวิ" / "หมวด 2"
 *    (Thai digits OK) → onNavigate(articleKey)
 *  - mobile: collapsible
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Chapter, LawDoc } from '@/types/lawlib';
import { articleKeyOf, articleLabel, flattenArticles } from '@/lib/lawlib-reader';
import { normalizeText } from '@/lib/lawlib/normalize';

interface TocSidebarProps {
  law: LawDoc;
  activeKey: string | null;
  /** Jump target — ReaderClient scrolls + highlights. */
  onNavigate: (articleKey: string) => void;
  /** Scroll-spy reports the article currently in the reading band. */
  onActiveChange: (articleKey: string) => void;
}

const ARTICLE_JUMP_RE = /^(?:มาตรา\s*)?(\d+)(?:\s*(ทวิ|ตรี|จัตวา|เบญจ|ฉ|สัตต|อัฏฐ|นว)|(\/\d+))?$/;
const CHAPTER_JUMP_RE = /^หมวด(?:ที่)?\s*(\d+)$/;

function resolveJump(query: string, law: LawDoc): string | null {
  const q = normalizeText(query);
  if (q === '') return null;
  const flat = flattenArticles(law);

  const am = q.match(ARTICLE_JUMP_RE);
  if (am !== null) {
    const no = Number(am[1]);
    const suffix = am[2] ?? am[3] ?? '';
    if (suffix !== '') {
      const hit = flat.find((f) => f.article.no === no && (f.article.suffix ?? '') === suffix);
      return hit !== undefined ? articleKeyOf(hit.article) : null;
    }
    const hit = flat.find((f) => f.article.no === no);
    return hit !== undefined ? articleKeyOf(hit.article) : null;
  }

  const cm = q.match(CHAPTER_JUMP_RE);
  if (cm !== null) {
    const chNo = Number(cm[1]);
    const chapter = law.chapters.find((c) => c.no === chNo);
    if (chapter === undefined) return null;
    const first = flat.find((f) => f.chapter === chapter);
    return first !== undefined ? articleKeyOf(first.article) : null;
  }

  return null;
}

export default function TocSidebar({
  law,
  activeKey,
  onNavigate,
  onActiveChange,
}: TocSidebarProps) {
  const flat = useMemo(() => flattenArticles(law), [law]);
  const keys = useMemo(() => flat.map((f) => articleKeyOf(f.article)), [flat]);

  const [panelOpen, setPanelOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 1024,
  );
  const [query, setQuery] = useState('');
  const [jumpFailed, setJumpFailed] = useState(false);

  // --- scroll-spy suppression during programmatic jumps ----------------------
  // A smooth scroll passes intermediate articles through the spy band, so the
  // highlight flickers to whatever article is mid-passage. Set the flag when
  // WE jump; clear on scrollend, with a 600ms timer fallback (scrollend never
  // fires when the target is already in view — no scroll occurred). Observer
  // entries are ignored while the flag is set.
  const suppressSpyRef = useRef(false);
  const spyTimerRef = useRef<number | null>(null);

  const handleNavigate = useCallback(
    (key: string) => {
      suppressSpyRef.current = true;
      if (spyTimerRef.current !== null) window.clearTimeout(spyTimerRef.current);
      const clear = () => {
        suppressSpyRef.current = false;
        if (spyTimerRef.current !== null) {
          window.clearTimeout(spyTimerRef.current);
          spyTimerRef.current = null;
        }
      };
      window.addEventListener('scrollend', clear, { once: true });
      spyTimerRef.current = window.setTimeout(clear, 600);
      onNavigate(key);
    },
    [onNavigate],
  );

  // --- scroll-spy: the article crossing the 15–30% viewport band is active --
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressSpyRef.current) return; // programmatic jump in flight
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        let best = visible[0];
        for (const e of visible) {
          if (e.boundingClientRect.top < best.boundingClientRect.top) best = e;
        }
        const key = (best.target as HTMLElement).dataset.lawlibArticle;
        if (key !== undefined) onActiveChange(key);
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    );
    for (const f of flat) {
      const el = document.getElementById(`มาตรา-${articleKeyOf(f.article)}`);
      if (el !== null) observer.observe(el);
    }
    return () => {
      observer.disconnect();
      if (spyTimerRef.current !== null) window.clearTimeout(spyTimerRef.current);
    };
  }, [flat, onActiveChange]);

  // Keep the active TOC item visible inside its scroll container.
  useEffect(() => {
    if (activeKey === null) return;
    const el = document.getElementById(`lawlib-toc-${activeKey}`);
    const box = el?.closest('[data-lawlib-toc-scroll]');
    if (el === null || box === null || box === undefined) return;
    const r = el.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    box.scrollTop += r.top - b.top - b.height / 2 + r.height / 2;
  }, [activeKey]);

  const idx = activeKey !== null ? keys.indexOf(activeKey) : -1;
  const prevKey = idx > 0 ? keys[idx - 1] : null;
  const nextKey = idx >= 0 && idx < keys.length - 1 ? keys[idx + 1] : null;

  // Contextual jump examples — real numbers from THIS law (fall back to
  // generic ones when the law has no articles/chapters yet).
  const exampleArticle = flat[0]?.article.no;
  const exampleChapter = law.chapters.find((c) => c.no !== null)?.no;
  const jumpHint = [
    exampleArticle !== undefined ? `มาตรา ${exampleArticle}` : null,
    exampleChapter !== undefined ? `หมวด ${exampleChapter}` : null,
  ]
    .filter((s): s is string => s !== null)
    .join(' หรือ ');

  const handleJump = () => {
    const key = resolveJump(query, law);
    if (key === null) {
      setJumpFailed(true);
      return;
    }
    setJumpFailed(false);
    setQuery('');
    handleNavigate(key);
  };

  const navItem = (key: string, label: string, indent: boolean): React.ReactNode => {
    const active = key === activeKey;
    return (
      <li key={key} id={`lawlib-toc-${key}`}>
        <button
          type="button"
          onClick={() => handleNavigate(key)}
          aria-current={active ? 'true' : undefined}
          className={`block min-h-11 w-full rounded-md px-2 py-1 text-left text-[13px] leading-relaxed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            indent ? 'pl-5' : ''
          } ${
            active
              ? 'bg-blue-100 font-semibold text-blue-900 dark:bg-blue-950/60 dark:text-blue-200'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
          } cursor-pointer`}
        >
          {label}
        </button>
      </li>
    );
  };

  const chapterNode = (chapter: Chapter, ci: number): React.ReactNode => {
    const chapterLabel = `${chapter.no !== null ? `หมวด ${chapter.no} — ` : ''}${chapter.title}`;
    return (
      <li key={ci} className="space-y-0.5">
        <div className="px-2 pb-0.5 pt-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {chapterLabel}
        </div>
        <ul className="space-y-0.5">
          {chapter.articles.map((a) =>
            navItem(articleKeyOf(a), articleLabel(a.no, a.suffix), false),
          )}
          {chapter.sections?.map((section, si) => (
            <li key={`s${si}`}>
              {(section.no !== null || section.title !== '') && (
                <div className="px-2 pb-0.5 pt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {section.no !== null ? `ส่วนที่ ${section.no} — ` : ''}
                  {section.title}
                </div>
              )}
              <ul className="space-y-0.5">
                {section.articles.map((a) =>
                  navItem(articleKeyOf(a), articleLabel(a.no, a.suffix), true),
                )}
              </ul>
            </li>
          ))}
        </ul>
      </li>
    );
  };

  return (
    <div className="lawlib-toc glass-2 rounded-2xl border border-slate-200 p-3 shadow-sm dark:border-slate-700 lg:sticky lg:top-6">
      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        aria-expanded={panelOpen}
        className="mb-3 flex min-h-11 w-full cursor-pointer items-center justify-between px-1 py-1 text-sm font-semibold text-slate-700 dark:text-slate-200 lg:hidden"
      >
        สารบัญ
        <i
          aria-hidden="true"
          className={`fi fi-sr-angle-small-down text-xs transition-transform ${panelOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <div className={panelOpen ? 'block' : 'hidden lg:block'}>
        {/* jump box (FR7) */}
        <div className="mb-3">
          <label htmlFor="lawlib-jump" className="sr-only">
            ข้ามไปยังมาตรา
          </label>
          <div className="flex gap-1.5">
            <input
              id="lawlib-jump"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (jumpFailed) setJumpFailed(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJump();
              }}
              placeholder="มาตรา 60 / หมวด 2"
              aria-invalid={jumpFailed}
              aria-describedby={jumpFailed ? 'lawlib-jump-error' : undefined}
              className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
            <button
              type="button"
              onClick={handleJump}
              className="shrink-0 min-h-11 cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              ไป
            </button>
          </div>
          {jumpFailed && (
            <p
              id="lawlib-jump-error"
              role="alert"
              className="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              ไม่พบ — ลอง “{jumpHint || 'มาตรา 60'}”
            </p>
          )}
        </div>

        {/* prev / next มาตรา */}
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={prevKey === null}
            onClick={() => prevKey !== null && handleNavigate(prevKey)}
            className="flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <i aria-hidden="true" className="fi fi-sr-angle-left text-[10px]" />
            ก่อนหน้า
          </button>
          <button
            type="button"
            disabled={nextKey === null}
            onClick={() => nextKey !== null && handleNavigate(nextKey)}
            className="flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            ถัดไป
            <i aria-hidden="true" className="fi fi-sr-angle-right text-[10px]" />
          </button>
        </div>

        {/* nav tree */}
        <nav
          aria-label="สารบัญ"
          data-lawlib-toc-scroll
          className="overflow-y-auto pb-4 lg:max-h-[calc(100vh-12rem)] lg:pr-1"
        >
          <ul className="space-y-1">
            {law.chapters.map((chapter, ci) => chapterNode(chapter, ci))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
