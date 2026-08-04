'use client';

/**
 * KruLAW — digest study-mode renderer (L5). Receives the server-built
 * DigestView (title + sections of render-ready lines) via DigestShell and
 * renders it as a readable study page: section headings, article cards with
 * deep links into the law reader, [[มาตรา N]] inline refs, [ดูเต็ม] chips,
 * and a per-section มาตรา jump-strip. No localStorage/state — pure render.
 */

import Link from 'next/link';
import type { DigestView, RenderLine, RenderToken } from './digest-view';

/** Inline `~~…~~` strikethrough + `**…**` bold over plain text (unbalanced markers stay literal). */
function InlineText({ text }: { text: string }) {
  const strikeParts = text.split(/~~(.+?)~~/g);
  return (
    <>
      {strikeParts.map((part, i) =>
        i % 2 === 1 ? (
          <s key={i} className="text-slate-400 dark:text-slate-500">
            {part}
          </s>
        ) : (
          <BoldText key={i} text={part} />
        ),
      )}
    </>
  );
}

function BoldText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-slate-900 dark:text-white">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function Token({ token }: { token: RenderToken }) {
  if (token.kind === 'text') return <InlineText text={token.text} />;
  if (token.href === null) {
    // unresolved cross-law ref → plain text
    return <span>{token.label}</span>;
  }
  if (token.kind === 'seefull') {
    return (
      <Link
        href={token.href}
        className="ml-1 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-blue-700"
      >
        ดูเต็ม {token.label}
        <i aria-hidden="true" className="fi fi-sr-arrow-small-right text-[10px] leading-none" />
      </Link>
    );
  }
  return (
    <Link
      href={token.href}
      className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
    >
      {token.label}
    </Link>
  );
}

/** Body-line styling shared by top-level lines and article-card parts. */
type BodyKind = Exclude<RenderLine['kind'], 'article'>;

function BodyLine({ kind, tokens }: { kind: BodyKind; tokens: RenderToken[] }) {
  if (kind === 'h3') {
    return (
      <h3 className="mt-8 text-xl font-bold leading-relaxed text-slate-900 dark:text-white">
        {tokens.map((tok, i) => (
          <Token key={i} token={tok} />
        ))}
      </h3>
    );
  }
  if (kind === 'quote') {
    return (
      <p className="mt-3 border-l-4 border-amber-300 bg-amber-50 px-4 py-2 text-sm leading-relaxed text-slate-600 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-slate-300">
        {tokens.map((tok, i) => (
          <Token key={i} token={tok} />
        ))}
      </p>
    );
  }
  if (kind === 'bullet') {
    return (
      <p className="mt-2 flex gap-2 leading-relaxed text-slate-700 dark:text-slate-300">
        <span aria-hidden="true" className="shrink-0 select-none text-blue-500">
          •
        </span>
        <span>
          {tokens.map((tok, i) => (
            <Token key={i} token={tok} />
          ))}
        </span>
      </p>
    );
  }
  return (
    <p
      className={`mt-3 leading-relaxed text-slate-700 dark:text-slate-300 ${
        kind === 'numbered' ? 'pl-5' : ''
      }`}
    >
      {tokens.map((tok, i) => (
        <Token key={i} token={tok} />
      ))}
    </p>
  );
}

function Line({ line }: { line: RenderLine }) {
  if (line.kind === 'article') {
    return (
      <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <Link
          href={line.href}
          className="text-lg font-bold leading-relaxed text-blue-700 hover:underline dark:text-blue-300"
        >
          {line.label}
          <i aria-hidden="true" className="fi fi-sr-arrow-small-right ml-1 text-sm" />
        </Link>
        {line.parts.map((part, j) => (
          <BodyLine key={j} kind={part.kind} tokens={part.tokens} />
        ))}
      </div>
    );
  }
  return <BodyLine kind={line.kind} tokens={line.tokens} />;
}

function Section({ section }: { section: DigestView['sections'][number] }) {
  return (
    <section className="mt-12">
      <h2 className="border-b-2 border-blue-100 pb-2 text-2xl font-bold leading-relaxed text-slate-900 dark:border-slate-700 dark:text-white">
        {section.heading}
      </h2>
      {section.articles.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            สารบัญมาตรา
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {section.articles.map((a) => (
              <Link
                key={a.key}
                href={a.href}
                className="rounded-full border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-slate-600 dark:text-blue-300 dark:hover:bg-slate-800"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="mt-2">
        {section.lines.map((line, i) => (
          <Line key={i} line={line} />
        ))}
      </div>
    </section>
  );
}

export default function DigestStudyClient({ view }: { view: DigestView }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/krulaw"
        className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
      >
        ← กลับไปหน้ารายการกฎหมาย
      </Link>
      <h1 className="mt-4 text-3xl font-bold leading-relaxed text-slate-900 dark:text-white">
        {view.title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        สรุปสาระสำคัญแบบอ่านง่าย — กดมาตราเพื่ออ่านฉบับเต็ม
      </p>
      {view.sections.map((section, i) => (
        <Section key={i} section={section} />
      ))}
    </div>
  );
}
