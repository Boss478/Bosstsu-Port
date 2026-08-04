/**
 * KruLAW digest page — render model (server-built in digest/page.tsx, rendered
 * by DigestStudyClient through the ssr:false DigestShell boundary).
 *
 * Type-only module: no 'use client' directive (imports are erased at compile
 * time), importable from both the server page and the client shell.
 */

/** One inline segment of a rendered digest line. */
export type RenderToken =
  | { kind: 'text'; text: string }
  | {
      kind: 'ref' | 'seefull';
      /** Link label (parseRef display, e.g. 'มาตรา 51/1'). */
      label: string;
      /** null → render as plain text (unresolved cross-law ref). */
      href: string | null;
    };

/** One rendered body line of a digest section. */
export type RenderLine =
  | { kind: 'h3' | 'quote' | 'bullet' | 'numbered' | 'text'; tokens: RenderToken[] }
  | {
      kind: 'article';
      label: string;
      href: string;
      /** Header content first, then continuation lines until the next article header (or `### `). */
      parts: Array<{ kind: 'quote' | 'bullet' | 'numbered' | 'text'; tokens: RenderToken[] }>;
    };

export interface RenderSection {
  heading: string;
  /** Article jump chips — deduped, in document order. */
  articles: Array<{ key: string; label: string; href: string }>;
  lines: RenderLine[];
}

export interface DigestView {
  title: string;
  sections: RenderSection[];
}
