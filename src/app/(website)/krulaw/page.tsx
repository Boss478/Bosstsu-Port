import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import KrulawListClient, { type KrulawIndexEntry } from './KrulawListClient';

export const metadata: Metadata = {
  title: 'KruLAW — คลังกฎหมาย',
  description:
    'อ่านกฎหมายไทยแบบเข้าใจง่าย — ค้นหาและอ่านกฎหมายการศึกษา แบ่งเป็นหมวดและมาตรา พร้อมบทนิยามและประวัติการแก้ไขเพิ่มเติม',
};

// Reads src/data/krulaw/index.json via node fs (never a static import — the
// file may not exist yet, and a missing file must not break compilation).
//
// Per-entry shape filter (same approach as [slug]/page.tsx): a malformed
// index must never crash the list render — KrulawListClient reads every
// field (slug/code/titleTh/subject/part/tags/verifiedAt/editionCount/
// articleCount/definitionTerms), so non-conforming entries are DROPPED.
function isKrulawIndexEntry(item: unknown): item is KrulawIndexEntry {
  if (typeof item !== 'object' || item === null) return false;
  const e = item as Record<string, unknown>;
  return (
    typeof e.slug === 'string' &&
    typeof e.code === 'string' &&
    typeof e.titleTh === 'string' &&
    typeof e.subject === 'string' &&
    (e.part === 'ก' || e.part === 'ข') &&
    Array.isArray(e.tags) &&
    e.tags.every((t) => typeof t === 'string') &&
    typeof e.verifiedAt === 'string' &&
    typeof e.editionCount === 'number' &&
    typeof e.articleCount === 'number' &&
    Array.isArray(e.definitionTerms) &&
    e.definitionTerms.every((t) => typeof t === 'string')
  );
}

function readKrulawIndex(): KrulawIndexEntry[] | null {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'src/data/krulaw/index.json'), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isKrulawIndexEntry);
  } catch {
    return null;
  }
}

export default function KrulawIndexPage() {
  const index = readKrulawIndex();

  if (index === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg text-slate-600 dark:text-slate-300">
          ยังไม่มีข้อมูลกฎหมาย — รัน{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            npm run krulaw:build
          </code>{' '}
          เพื่อสร้างข้อมูลแล้วลองใหม่
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold leading-relaxed text-slate-900 dark:text-white">
          KruLAW — คลังกฎหมาย
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          อ่านกฎหมายไทยแบบเข้าใจง่าย ทั้งฉบับ แบ่งเป็นหมวดและมาตรา พร้อมบทนิยาม
          ประวัติการแก้ไขเพิ่มเติม และการค้นหามาตรา
        </p>
      </header>
      <KrulawListClient laws={index} />
    </div>
  );
}
