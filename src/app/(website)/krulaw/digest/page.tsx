import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  matchDigestArticleHeader,
  parseDigestMd,
  tokenizeDigestLine,
  type DigestDoc,
  type DigestLineToken,
  type DigestRef,
} from '@/lib/krulaw/parser';
import type { DigestView, RenderLine, RenderSection, RenderToken } from './digest-view';
import DigestShell from './DigestShell';

// This route renders ONE digest: the พ.ร.บ.การศึกษาแห่งชาติ study dictionary
// (content/krulaw/digests/education-law-dictionary.md). Its [[มาตรา N]] refs
// deep-link into the law reader at /krulaw/national-education-act-2542
// #มาตรา-N (anchor = `${no}${suffix}`, per ArticleView / parseHashToKey).
const DIGEST_FILE = 'content/krulaw/digests/education-law-dictionary.md';
const DIGEST_LAW_SLUG = 'national-education-act-2542';
const DIGEST_LAW_HREF = `/krulaw/${DIGEST_LAW_SLUG}`;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'KruLAW — พจนานุกรมกฎหมายการศึกษา',
    description:
      'สรุปสาระสำคัญของ พ.ร.บ.การศึกษาแห่งชาติ พ.ศ. 2542 — ข้อมูลกฎหมาย เหตุผลและสรุปการแก้ไข คำนิยามสำคัญ และมาตราสำคัญ พร้อมลิงก์อ่านฉบับเต็ม',
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
      path.join(process.cwd(), 'content/krulaw/planned-laws.json'),
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

/** 'มาตรา 10' | 'มาตรา 10 ทวิ' | 'มาตรา 10/1' — article display label. */
function articleLabel(no: number, suffix?: string): string {
  return `มาตรา ${no}${suffix ? (suffix.startsWith('/') ? suffix : ` ${suffix}`) : ''}`;
}

/**
 * Deep link for a ref: same-law → the digest's target law; cross-law → the
 * planned-laws slug of the authored code. null → unresolved (plain text).
 *
 * Defense in depth: build.ts already rejects non-conforming planned-law
 * slugs (validatePlannedLaws), but a hand-edited manifest must never emit a
 * junk href — non `/^[a-z0-9-]+$/i` slugs resolve to null (plain text).
 */
function refHref(ref: DigestRef, aliases: Map<string, string>): string | null {
  const key = `${ref.articleNo}${ref.articleSuffix ?? ''}`;
  const base = ref.lawSlug !== undefined ? aliases.get(ref.lawSlug) : DIGEST_LAW_SLUG;
  if (base === undefined || !/^[a-z0-9-]+$/i.test(base)) return null;
  return `/krulaw/${base}#มาตรา-${key}`;
}

function toRenderTokens(tokens: DigestLineToken[], aliases: Map<string, string>): RenderToken[] {
  return tokens.map((tok) =>
    tok.kind === 'text'
      ? { kind: 'text', text: tok.t }
      : { kind: tok.kind, label: tok.ref.display, href: refHref(tok.ref, aliases) },
  );
}

function classifyLine(line: string): 'h3' | 'quote' | 'bullet' | 'numbered' | 'text' {
  if (line.startsWith('### ')) return 'h3';
  if (line.startsWith('> ')) return 'quote';
  if (line.startsWith('- ')) return 'bullet';
  if (/^\(\d+\)/.test(line)) return 'numbered';
  return 'text';
}

/** Build the render model: line kinds + article jump chips per section. */
function buildView(doc: DigestDoc, aliases: Map<string, string>): DigestView {
  const sections: RenderSection[] = doc.sections.map((section) => {
    const lines: RenderLine[] = [];
    const seen = new Set<string>();
    const articles: RenderSection['articles'] = [];
    // Continuation lines (วรรค, bullets, amendment quotes) group into the open
    // article card until the next article header — or a `### ` sub-heading.
    let openArticle: Extract<RenderLine, { kind: 'article' }> | null = null;

    const closeArticle = (): void => {
      if (openArticle !== null) {
        lines.push(openArticle);
        openArticle = null;
      }
    };

    for (const rawLine of section.body.split('\n')) {
      const line = rawLine.trimEnd();
      if (line === '') continue; // blank lines → spacing handled by the shell

      const header = matchDigestArticleHeader(line);
      if (header) {
        closeArticle();
        const key = `${header.no}${header.suffix ?? ''}`;
        const label = articleLabel(header.no, header.suffix);
        const href = `${DIGEST_LAW_HREF}#มาตรา-${key}`;
        if (!seen.has(key)) {
          seen.add(key);
          articles.push({ key, label, href });
        }
        openArticle = {
          kind: 'article',
          label,
          href,
          parts: [
            {
              kind: 'text',
              tokens: toRenderTokens(tokenizeDigestLine(header.rest), aliases),
            },
          ],
        };
        continue;
      }

      const kind = classifyLine(line);
      // The line-prefix markers are replaced by the shell's styling — only the
      // content after them is tokenized.
      const content =
        kind === 'quote' ? line.replace(/^>\s?/, '') : kind === 'bullet' ? line.slice(2) : line;
      const tokens = toRenderTokens(tokenizeDigestLine(content), aliases);
      if (kind === 'h3') closeArticle(); // `### ` starts a new block context
      if (openArticle !== null && kind !== 'h3') {
        openArticle.parts.push({ kind, tokens });
      } else {
        lines.push({ kind, tokens });
      }
    }
    closeArticle();

    return { heading: section.heading, articles, lines };
  });

  return { title: doc.title, sections };
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
          content/krulaw/digests/education-law-dictionary.md
        </code>
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

export default function KrulawDigestPage() {
  const md = readDigestMarkdown();
  // Empty/missing digest file → friendly error page (never a blank render).
  if (md === null || md.trim() === '') return <DigestUnavailable />;

  const doc = parseDigestMd(md);
  if (doc.title === '' && doc.sections.length === 0) return <DigestUnavailable />;

  const view = buildView(doc, readPlannedLawAliases());
  return <DigestShell view={view} />;
}
