'use client';

/**
 * LawLib — bookmarks list grouped by chapter (Bookmark v2 — ADR-019 D3).
 *
 * Lives inside the dock v2 "เพิ่มเติม" panel (Level 2). Each bookmark row
 * jumps (navigate + close) or deletes. Groups render in law order: chapters
 * in doc order, section-nested articles under their section title.
 */
import { useMemo } from 'react';
import { articleLabel, findArticleByKey } from '@/lib/lawlib-reader';
import type { LawDoc } from '@/types/lawlib';

interface GroupedBookmark {
  key: string;
  label: string;
}

interface BookmarkGroup {
  title: string;
  items: GroupedBookmark[];
}

export function BookmarksPanel({
  law,
  keys,
  onNavigate,
  onRemove,
}: {
  law: LawDoc;
  keys: string[];
  onNavigate: (key: string) => void;
  onRemove: (key: string) => void;
}) {
  const groups = useMemo<BookmarkGroup[]>(() => {
    const out: BookmarkGroup[] = [];
    const byTitle = new Map<string, BookmarkGroup>();
    for (const key of keys) {
      const hit = findArticleByKey(law, key);
      if (hit === undefined) continue; // stale key (law changed) — skip
      const label = articleLabel(hit.article.no, hit.article.suffix);
      const title =
        hit.section !== null ? `${hit.chapter.title} — ${hit.section.title}` : hit.chapter.title;
      let group = byTitle.get(title);
      if (group === undefined) {
        group = { title, items: [] };
        byTitle.set(title, group);
        out.push(group);
      }
      group.items.push({ key, label });
    }
    return out;
  }, [law, keys]);

  if (keys.length === 0 || groups.length === 0) {
    return (
      <p className="py-6 text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        ยังไม่มีที่คั่นหน้า — กดปุ่มที่คั่นหน้าเพื่อบันทึกมาตราที่กำลังอ่าน
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {groups.map((group) => (
        <li key={group.title}>
          <p className="mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {group.title}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li
                key={item.key}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800/60"
              >
                <button
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  className="min-h-11 min-w-0 flex-1 cursor-pointer truncate text-left text-xs font-medium text-blue-700 hover:underline dark:text-blue-300"
                >
                  {item.label}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.key)}
                  aria-label={`ลบที่คั่นหน้า ${item.label}`}
                  className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-700"
                >
                  <i aria-hidden="true" className="fi fi-sr-trash text-[10px]" />
                </button>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
