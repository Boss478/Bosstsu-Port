import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { parseDigestMd } from '@/lib/lawlib/parser';
import { glossaryIndex } from '@/lib/lawlib-reader';
import { buildView, type DigestView } from '@/lib/lawlib/digest-view';
import type { LawDoc } from '@/types/lawlib';
import LawlibReaderShell from './LawlibReaderShell';
import StaticFullText from './StaticFullText';

// Only slugs returned by generateStaticParams are valid — anything else is a
// REAL 404 (soft-200 fallbacks were leaking to crawlers).
export const dynamicParams = false;

interface LawlibIndexItem {
  slug: string;
}

// Reads src/data/lawlib/index.json via node fs (never a static import — the file
// may not exist yet, and a missing file must not break compilation).
function readLawlibIndex(): LawlibIndexItem[] | null {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'src/data/lawlib/index.json'), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((item): LawlibIndexItem | null => {
        if (typeof item === 'string') return { slug: item };
        if (item && typeof item === 'object' && 'slug' in item) {
          return { slug: String((item as { slug: unknown }).slug) };
        }
        return null;
      })
      .filter((item): item is LawlibIndexItem => item !== null);
  } catch {
    return null;
  }
}

/** Reads src/data/lawlib/laws/<slug>.json via node fs (friendly fallback). */
function readLaw(slug: string): LawDoc | null {
  // Route params are user-controlled — constrain to build-emitted slug shapes.
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'src/data/lawlib/laws', `${slug}.json`),
      'utf8',
    );
    return JSON.parse(raw) as LawDoc;
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

/**
 * Reads + builds the digest view for a law slug: `content/lawlib/digests/<slug>.md`.
 * Returns null when the file is missing/empty or parses to zero sections
 * (parsed-empty — a title-only md must NOT produce a toggle with an empty
 * compact view, loop-1 #5). Runs AFTER the `law === null` fallback.
 */
function buildDigestView(slug: string, law: LawDoc): DigestView | null {
  let md: string;
  try {
    md = fs.readFileSync(path.join(process.cwd(), 'content/lawlib/digests', `${slug}.md`), 'utf8');
  } catch {
    return null;
  }
  if (md.trim() === '') return null;
  const doc = parseDigestMd(md);
  if (doc.sections.length === 0) return null;
  return buildView(
    doc,
    readPlannedLawAliases(),
    law.chapters.map((ch) => ({
      no: ch.no,
      title: ch.title,
      articleKeys: [
        ...ch.articles.map((a) => `${a.no}${a.suffix ?? ''}`),
        ...(ch.sections ?? []).flatMap((s) => s.articles.map((a) => `${a.no}${a.suffix ?? ''}`)),
      ],
    })),
    glossaryIndex(law),
    { slug, href: `/lawlib/${slug}` },
  );
}

/** Truncate a law title for the <title> tag (~50 chars, Thai-safe at any cut). */
function truncateTitle(title: string, max = 50): string {
  return title.length > max ? `${title.slice(0, max)}…` : title;
}

export function generateStaticParams() {
  const index = readLawlibIndex();
  if (!index) return [];
  // 'sample' is a LOCAL PREVIEW FIXTURE, but when it IS present in index.json
  // (a `--include-sample` build) it must still render locally — so it is
  // included here. generateMetadata pins robots noindex for it, and a plain
  // production build never emits it into index.json (so it ships nothing).
  // dynamicParams=false keeps every other slug a real 404.
  return index.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const law = readLaw(slug);
  if (law !== null) {
    // Digest-first: the default view is COMPACT (loop-5 #2) — the description
    // front-loads the digest's keywords, then mentions the full text.
    const description = `อ่าน${law.titleTh} ฉบับย่อ — ข้อมูลกฎหมาย เหตุผลและสรุปการแก้ไข คำนิยามสำคัญ และมาตราสำคัญ พร้อมฉบับเต็มแบ่งเป็นหมวดและมาตรา`;
    return {
      title: `${truncateTitle(law.titleTh)} — LawLib`,
      description,
      alternates: { canonical: `/lawlib/${slug}` },
      openGraph: {
        title: `${law.titleTh} — LawLib`,
        description,
        type: 'article',
      },
      // Belt and braces: if the sample fixture somehow renders, keep it out
      // of search indexes.
      ...(slug === 'sample' ? { robots: { index: false, follow: false } } : {}),
    };
  }
  return {
    title: 'LawLib — อ่านกฎหมาย',
    description: 'อ่านกฎหมายไทยแบบเข้าใจง่าย — LawLib',
  };
}

export default async function LawlibLawPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = readLawlibIndex();
  const available = index?.some((item) => item.slug === slug) ?? false;
  const law = readLaw(slug);

  // Unknown slug (not in the built index) → real 404, never a soft-200 page.
  if (!available) notFound();

  // Index lists the slug but its law JSON is unreadable — a build
  // inconsistency (dev-facing fallback; friendly headline + secondary hint).
  if (law === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg text-slate-600 dark:text-slate-300">
          ยังไม่พร้อมใช้งานในขณะนี้ — โปรดลองใหม่อีกครั้งภายหลัง
        </p>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          หากเป็นผู้ดูแลระบบ: รัน{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            npm run lawlib:build
          </code>{' '}
          เพื่อสร้างข้อมูล
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

  // Digest pairing — AFTER the law fallback (never before a null law).
  const digestView = buildDigestView(slug, law);

  return (
    <>
      <LawlibReaderShell law={law} digestView={digestView} />
      {/* Crawler-friendly hybrid (FR9): the full law text must reach crawlers
          even though the app defaults to COMPACT and renders via ssr:false.
          AFTER the shell in JSX (parser paints the skeleton first). Hidden via
          CSS; no ids/data-*; see StaticFullText. */}
      {digestView !== null && <StaticFullText law={law} />}
    </>
  );
}
