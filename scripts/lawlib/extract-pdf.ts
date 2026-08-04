/**
 * LawLib — PDF text extraction helper (assist-only, NOT a content source).
 *
 * Run: npx tsx scripts/lawlib/extract-pdf.ts <input.pdf> <output.md>
 *
 * Thin CLI wrapper over pdfjs-dist (legacy Node build, no canvas, no OCR):
 *   1. read file → Buffer → Uint8Array → getDocument({ data })
 *   2. per page: getTextContent(), keep only text items ('str' in item —
 *      TextMarkedContent is skipped), join strings, insert newlines at
 *      item.hasEOL (paragraph structure preserved)
 *   3. page boundaries written as `[PAGE N]` markers — PLAIN TEXT, never an
 *      HTML comment: `<!-- page N -->` lines survive downstream parsing and
 *      render as visible (escaped) text in a วรรค. Any HTML-comment lines
 *      found in the extracted text are stripped (defense in depth).
 *
 * Garbling heuristic: pdf.js has no API flag for a missing ToUnicode CMap,
 * so we detect it statistically — for each fontName in `styles`, items with
 * `width > 0` whose str is empty, U+FFFD, or U+0000 (NUL) are unmapped
 * glyphs; if they exceed 10% of that font's items we print a WARN line.
 *
 * Output is a WORKING ARTIFACT for human-assisted authoring only —
 * never a law file. Thai numerals are NOT normalized here.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

interface TextItemLike {
  str: string;
  width?: number;
  hasEOL?: boolean;
  fontName?: string;
}

function usage(): never {
  console.error('Usage: npx tsx scripts/lawlib/extract-pdf.ts <input.pdf> <output.md>');
  process.exit(1);
}

/** TextItem has `str`; TextMarkedContent does not. */
function isTextItem(item: unknown): item is TextItemLike {
  return typeof item === 'object' && item !== null && 'str' in item;
}

/**
 * Per-font garbling check: warn when >10% of a font's items are unmapped
 * glyphs. pdf.js emits three signatures for a missing ToUnicode mapping:
 * empty strings (`''`), U+FFFD replacement chars, and — most commonly for
 * CID-keyed Thai fonts — U+0000 NUL bytes. We count all three.
 */
function warnOnGarbledFonts(items: TextItemLike[], styles: Record<string, unknown>): void {
  const counts = new Map<string, { unmapped: number; total: number }>();
  for (const item of items) {
    const fontName = item.fontName ?? 'unknown';
    const c = counts.get(fontName) ?? { unmapped: 0, total: 0 };
    c.total++;
    if (
      item.width !== undefined &&
      item.width > 0 &&
      (item.str.trim() === '' || item.str.includes('\uFFFD') || item.str.includes('\u0000'))
    ) {
      c.unmapped++;
    }
    counts.set(fontName, c);
  }
  for (const fontName of Object.keys(styles)) {
    const c = counts.get(fontName);
    if (!c || c.total === 0) continue;
    if (c.unmapped / c.total > 0.1) {
      console.warn(
        `WARN font=${fontName} unmapped=${c.unmapped}/${c.total} — possible CID/ToUnicode garbling, review output`,
      );
    }
  }
}

/** Join items into lines: hasEOL marks the end of a line (paragraph breaks kept). */
function itemsToText(items: TextItemLike[]): string {
  const lines: string[] = [];
  let buf = '';
  for (const item of items) {
    buf += item.str;
    if (item.hasEOL) {
      lines.push(buf);
      buf = '';
    }
  }
  if (buf !== '') lines.push(buf);
  return lines.join('\n');
}

/**
 * Strip HTML-comment lines (e.g. `<!-- page 3 -->`) from extracted text.
 * They survive downstream parsing and would render as visible escaped text
 * in a วรรค — page boundaries use the plain-text `[PAGE N]` marker form
 * instead (consistent with the existing raw-extract files).
 */
function stripHtmlCommentLines(text: string): string {
  return text
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      return !(t.startsWith('<!--') && t.endsWith('-->'));
    })
    .join('\n');
}

async function main(): Promise<void> {
  const [pdfArg, outArg] = process.argv.slice(2);
  if (!pdfArg || !outArg) usage();

  const pdfPath = resolve(pdfArg);
  const outPath = resolve(outArg);
  const data = new Uint8Array(readFileSync(pdfPath));

  let loadingTask;
  let pdf;
  try {
    loadingTask = getDocument({
      data,
      // Node defaults are fine (fake worker, no canvas), but be explicit:
      disableFontFace: true,
      useSystemFonts: false,
      verbosity: 0,
    });
    pdf = await loadingTask.promise;
  } catch (err) {
    console.error(`ERROR: failed to open PDF: ${String(err)}`);
    process.exit(1);
  }

  const sections: string[] = [];
  let totalChars = 0;

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const { items, styles } = await page.getTextContent();

    const textItems = items.filter(isTextItem);
    warnOnGarbledFonts(textItems, styles as Record<string, unknown>);

    const pageText = stripHtmlCommentLines(itemsToText(textItems));
    totalChars += pageText.replace(/\s/g, '').length;
    sections.push(`[PAGE ${p}]\n\n${pageText}`);
  }

  const header = `# ${basename(pdfPath)} — raw text extraction (WORKING ARTIFACT, NOT a law file)

> Generated: ${new Date().toISOString()} · Pages: ${pdf.numPages} · non-ws chars: ${totalChars}
> Tool: scripts/lawlib/extract-pdf.ts (pdfjs-dist legacy build, Node, no OCR)
> Page markers: \`[PAGE N]\` (plain text — HTML-comment lines are stripped). Thai numerals are NOT normalized.
> Garbled-font warnings (possible missing ToUnicode) are printed to stderr during the run.
> NOTE: missing glyphs appear as NUL bytes (\`\u0000\`) in the text — they mark
> exactly where the PDF's font has no ToUnicode mapping (see WARN lines above).
`;

  writeFileSync(outPath, header + sections.join('\n\n---\n\n') + '\n', 'utf8');
  console.log(`OK: wrote ${outPath}`);
  console.log(`Pages: ${pdf.numPages} · non-ws chars: ${totalChars}`);

  await loadingTask.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error(`ERROR: ${String(err)}`);
  process.exit(1);
});
