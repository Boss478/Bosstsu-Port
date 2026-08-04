import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { LawDoc } from '@/types/krulaw';
import KrulawReaderShell from './KrulawReaderShell';

// Only slugs returned by generateStaticParams are valid — anything else is a
// REAL 404 (soft-200 fallbacks were leaking to crawlers).
export const dynamicParams = false;

interface KrulawIndexItem {
  slug: string;
}

// Reads src/data/krulaw/index.json via node fs (never a static import — the file
// may not exist yet, and a missing file must not break compilation).
function readKrulawIndex(): KrulawIndexItem[] | null {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'src/data/krulaw/index.json'), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((item): KrulawIndexItem | null => {
        if (typeof item === 'string') return { slug: item };
        if (item && typeof item === 'object' && 'slug' in item) {
          return { slug: String((item as { slug: unknown }).slug) };
        }
        return null;
      })
      .filter((item): item is KrulawIndexItem => item !== null);
  } catch {
    return null;
  }
}

/** Reads src/data/krulaw/laws/<slug>.json via node fs (friendly fallback). */
function readLaw(slug: string): LawDoc | null {
  // Route params are user-controlled — constrain to build-emitted slug shapes.
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'src/data/krulaw/laws', `${slug}.json`),
      'utf8',
    );
    return JSON.parse(raw) as LawDoc;
  } catch {
    return null;
  }
}

/** Truncate a law title for the <title> tag (~50 chars, Thai-safe at any cut). */
function truncateTitle(title: string, max = 50): string {
  return title.length > max ? `${title.slice(0, max)}…` : title;
}

export function generateStaticParams() {
  const index = readKrulawIndex();
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
    const description = `อ่าน${law.titleTh} ฉบับเต็ม แบ่งเป็นหมวดและมาตรา พร้อมบทนิยามและประวัติการแก้ไขเพิ่มเติม`;
    return {
      title: `${truncateTitle(law.titleTh)} — KruLAW`,
      description,
      openGraph: {
        title: `${law.titleTh} — KruLAW`,
        description,
        type: 'article',
      },
      // Belt and braces: if the sample fixture somehow renders, keep it out
      // of search indexes.
      ...(slug === 'sample' ? { robots: { index: false, follow: false } } : {}),
    };
  }
  return {
    title: 'KruLAW — อ่านกฎหมาย',
    description: 'อ่านกฎหมายไทยแบบเข้าใจง่าย — KruLAW',
  };
}

export default async function KrulawLawPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = readKrulawIndex();
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
            npm run krulaw:build
          </code>{' '}
          เพื่อสร้างข้อมูล
        </p>
        <Link
          href="/krulaw"
          className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
        >
          ← กลับไปหน้ารายการกฎหมาย
        </Link>
      </div>
    );
  }

  return <KrulawReaderShell law={law} />;
}
