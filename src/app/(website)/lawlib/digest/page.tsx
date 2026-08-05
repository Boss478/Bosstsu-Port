import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import type { Metadata } from 'next';
import { parseDigestMd } from '@/lib/lawlib/parser';
import { glossaryIndex } from '@/lib/lawlib-reader';
import type { LawDoc } from '@/types/lawlib';
import { buildView, type DigestChapterInfo, type DigestView } from '@/lib/lawlib/digest-view';
import DigestShell from './DigestShell';

// This route renders ONE digest: the พ.ร.บ.การศึกษาแห่งชาติ study dictionary
// (content/lawlib/digests/national-education-act-2542.md). Its [[มาตรา N]] refs
// deep-link into the law reader at /lawlib/national-education-act-2542
// #มาตรา-N (anchor = `${no}${suffix}`, per ArticleView / parseHashToKey).
const DIGEST_FILE = 'content/lawlib/digests/national-education-act-2542.md';
const DIGEST_LAW_SLUG = 'national-education-act-2542';
const DIGEST_LAW_HREF = `/lawlib/${DIGEST_LAW_SLUG}`;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'พจนานุกรมกฎหมาย พ.ร.บ.การศึกษาแห่งชาติ 2542 — LawLib',
    description:
      'สรุปสาระสำคัญของ พ.ร.บ.การศึกษาแห่งชาติ พ.ศ. 2542 — ข้อมูลกฎหมาย เหตุผลและสรุปการแก้ไข คำนิยามสำคัญ และมาตราสำคัญ พร้อมลิงก์อ่านฉบับเต็ม',
    openGraph: {
      title: 'พจนานุกรมกฎหมาย พ.ร.บ.การศึกษาแห่งชาติ 2542 — LawLib',
      description:
        'สรุปสาระสำคัญของ พ.ร.บ.การศึกษาแห่งชาติ พ.ศ. 2542 — ข้อมูลกฎหมาย เหตุผลและสรุปการแก้ไข คำนิยามสำคัญ และมาตราสำคัญ พร้อมลิงก์อ่านฉบับเต็ม',
      type: 'article',
    },
  };
}

/** Reads the digest markdown via node fs (friendly fallback when absent). */
function readDigestMarkdown(): string | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), DIGEST_FILE), 'utf8');
  } catch {
    return null;
  }
}

/**
 * planned-laws.json code → slug alias map (cross-law [[มาตรา N|code]] ref
 * resolution). Absent/unreadable → empty map (cross-law refs render plain).
 */
function readPlannedLawAliases(): Map<string, string> {
  const aliases = new Map<string, string>();
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'content/lawlib/planned-laws.json'),
      'utf8',
    );
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item && typeof item === 'object' && 'code' in item && 'slug' in item) {
          aliases.set(
            String((item as { code: unknown }).code),
            String((item as { slug: unknown }).slug),
          );
        }
      }
    }
  } catch {
    // alias map missing → cross-law refs render as plain text
  }
  return aliases;
}

/** Reads the digest's target law JSON via node fs (friendly fallback → null). */
function readDigestLaw(): LawDoc | null {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'src/data/lawlib/laws', `${DIGEST_LAW_SLUG}.json`),
      'utf8',
    );
    return JSON.parse(raw) as LawDoc;
  } catch {
    return null;
  }
}

/**
 * Chapter boundary table for the digest's target law — from the law JSON.
 * Absent/unreadable → null (digest renders flat, no chapter groups). Used to
 * split the 76-card มาตราสำคัญ section into expandable หมวดที่ 1–9 /
 * บทเฉพาะกาล groups.
 */
function lawChapters(law: LawDoc): DigestChapterInfo[] | null {
  if (!Array.isArray(law.chapters)) return null;
  return law.chapters.map((ch) => ({
    no: ch.no,
    title: ch.title,
    articleKeys: [
      ...ch.articles.map((a) => `${a.no}${a.suffix ?? ''}`),
      ...(ch.sections ?? []).flatMap((s) => s.articles.map((a) => `${a.no}${a.suffix ?? ''}`)),
    ],
  }));
}

/** Friendly fallback when the digest file is missing/empty. */
function DigestUnavailable() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-lg text-slate-600 dark:text-slate-300">
        ยังไม่พร้อมใช้งานในขณะนี้ — โปรดลองใหม่อีกครั้งภายหลัง
      </p>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        หากเป็นผู้ดูแลระบบ: ตรวจสอบไฟล์{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          content/lawlib/digests/national-education-act-2542.md
        </code>
      </p>
      <Link
        href="/lawlib"
        className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
      >
        ← กลับไปหน้ารายการกฎหมาย
      </Link>
    </div>
  );
}

export default function LawlibDigestPage() {
  const md = readDigestMarkdown();
  // Empty/missing digest file → friendly error page (never a blank render).
  if (md === null || md.trim() === '') return <DigestUnavailable />;

  const doc = parseDigestMd(md);
  if (doc.title === '' && doc.sections.length === 0) return <DigestUnavailable />;

  const law = readDigestLaw();
  const view: DigestView = buildView(
    doc,
    readPlannedLawAliases(),
    law !== null ? lawChapters(law) : null,
    law !== null ? glossaryIndex(law) : [],
    { slug: DIGEST_LAW_SLUG, href: DIGEST_LAW_HREF },
  );
  return <DigestShell view={view} />;
}
