'use client';

/**
 * DigestToc — compact-view table of contents (T4 redesign, user decisions
 * 2026-08-05: "same TOC feature as FULL, digest structure" + "show each
 * มาตรา on TOC").
 *
 * Hierarchical, mirroring FULL's TocSidebar:
 *  - non-group sections (ข้อมูลกฎหมาย / เหตุผล / คำนิยาม) → scroll to heading
 *  - chapter groups (หมวดที่ 1–9, บทเฉพาะกาล) → expand-if-collapsed + scroll,
 *    with EVERY มาตรา of the group nested beneath (jump rule: clicking a มาตรา
 *    under a collapsed group auto-expands it via the reader's cardGroupMap)
 *  - preamble article cards (outside any group, rare) → top-level entries
 * Scroll-spy mirrors FULL's TocSidebar (IntersectionObserver, center band);
 * the active มาตรา entry is also highlighted via the reader's activeKey.
 *
 * The มาตราสำคัญ section heading itself is NOT listed (suppressed in the
 * compact render — the groups ARE the structure, user decision).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DigestView } from '@/lib/lawlib/digest-view';

export interface DigestTocSection {
  kind: 'section';
  /** Scroll-target element id ('digest-sec-<i>'). */
  id: string;
  label: string;
}

export interface DigestTocArticle {
  kind: 'article';
  /** Article key — jump rule (auto-expands a collapsed group). */
  key: string;
  label: string;
}

export interface DigestTocGroup {
  kind: 'group';
  /** Scroll-target element id ('<group-id>-region'). */
  id: string;
  label: string;
  groupId: string;
  articles: DigestTocArticle[];
}

export type DigestTocEntry = DigestTocSection | DigestTocGroup | DigestTocArticle;

/** Pure TOC builder: sections + groups (each with its มาตรา list), doc order. */
export function buildDigestToc(view: DigestView): DigestTocEntry[] {
  const entries: DigestTocEntry[] = [];
  view.sections.forEach((section, i) => {
    if (section.groups !== undefined) {
      // the มาตราสำคัญ-style section: groups with their articles nested
      for (const g of section.groups) {
        entries.push({
          kind: 'group',
          id: `${g.id}-region`,
          label: g.label,
          groupId: g.id,
          articles: g.lines
            .filter((l): l is Extract<typeof l, { kind: 'article' }> => l.kind === 'article')
            .map((l) => ({ kind: 'article', key: l.key, label: l.label })),
        });
      }
      // preamble cards (before the first group) become top-level entries
      for (const l of section.lines) {
        if (l.kind === 'article') {
          entries.push({ kind: 'article', key: l.key, label: l.label });
        }
      }
      return;
    }
    entries.push({ kind: 'section', id: `digest-sec-${i}`, label: section.heading });
    for (const l of section.lines) {
      if (l.kind === 'article') {
        entries.push({ kind: 'article', key: l.key, label: l.label });
      }
    }
  });
  return entries;
}

export default function DigestToc({
  view,
  collapsedGroups,
  onExpandGroup,
  onNavigate,
  activeArticleKey,
}: {
  view: DigestView;
  collapsedGroups: ReadonlySet<string>;
  onExpandGroup: (groupId: string) => void;
  onNavigate: (key: string) => void;
  activeArticleKey: string | null;
}) {
  const entries = useMemo(() => buildDigestToc(view), [view]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Scroll-spy (mirrors TocSidebar): the section/group whose target crosses
  // the center band is active. Targets inside collapsed groups stay hidden.
  useEffect(() => {
    const targets = entries
      .filter((e): e is DigestTocSection | DigestTocGroup => e.kind !== 'article')
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    const obs = new IntersectionObserver(
      (list) => {
        const visible = list
          .filter((en) => en.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    for (const t of targets) obs.observe(t);
    return () => obs.disconnect();
  }, [entries, collapsedGroups]);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const reducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scrollToId = (id: string) => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }, 0);
  };

  const jumpGroup = (entry: DigestTocGroup) => {
    if (collapsedGroups.has(entry.groupId)) onExpandGroup(entry.groupId);
    scrollToId(entry.id);
  };

  const baseBtn =
    'block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
  const activeBtn = 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300';
  const idleBtn =
    'text-slate-600 hover:bg-slate-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-blue-300';

  return (
    <nav
      aria-label="สารบัญเวอร์ชันย่อ"
      className="lawlib-toc sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto"
    >
      <ul className="space-y-1">
        {entries.map((entry) => {
          if (entry.kind === 'section') {
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => scrollToId(entry.id)}
                  className={`${baseBtn} ${activeId === entry.id ? activeBtn : idleBtn}`}
                >
                  {entry.label}
                </button>
              </li>
            );
          }
          if (entry.kind === 'group') {
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => jumpGroup(entry)}
                  className={`${baseBtn} font-semibold ${activeId === entry.id ? activeBtn : idleBtn}`}
                >
                  {entry.label}
                </button>
                <ul className="ml-3 space-y-0.5 border-l border-slate-200 pl-2 dark:border-slate-700">
                  {entry.articles.map((a) => (
                    <li key={a.key}>
                      <button
                        type="button"
                        onClick={() => onNavigate(a.key)}
                        aria-current={activeArticleKey === a.key ? 'true' : undefined}
                        className={`${baseBtn} py-1.5 text-xs ${
                          activeArticleKey === a.key ? activeBtn : idleBtn
                        }`}
                      >
                        {a.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            );
          }
          return (
            <li key={entry.key}>
              <button
                type="button"
                onClick={() => onNavigate(entry.key)}
                aria-current={activeArticleKey === entry.key ? 'true' : undefined}
                className={`${baseBtn} py-1.5 text-xs ${
                  activeArticleKey === entry.key ? activeBtn : idleBtn
                }`}
              >
                {entry.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
