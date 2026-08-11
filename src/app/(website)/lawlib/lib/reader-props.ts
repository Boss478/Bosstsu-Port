/**
 * LawLib — leaf panel props contract (FROZEN for Wave 2 — owned by lane D1,
 * imported by the reader core lane B2). Type-only module: no runtime exports,
 * no `'use client'` directive (imports are erased at compile time).
 *
 * Component API:
 * - SearchPanel      ({ articles, onJump })         FR6 — in-law search
 * - GlossaryPanel    ({ definitions, onTerm })      FR8 — มาตรา definitions
 * - EditionTimeline  ({ editions })                 FR9 — amendment history
 * - ReadingSettings  ({ settings, onChange })       FR11 — controlled settings UI
 *
 * All four components are CONTROLLED (props in / callbacks out). Persistence
 * lives in `hooks/useReaderStorage`; wiring lives in LawlibReaderClient (B2).
 *
 * FROZEN-CONTRACT EXTENSION (rev 5.5 — FULL/COMPACT merge, loop-2 #4, loop-4
 * #5/#6, recorded in ADR-017 D13): SearchPanelProps gains OPTIONAL
 * `digestLines` + `onDigestLineJump` (digest summary-line search, COMPACT
 * view only). Both optional — existing callers are unaffected. This is a
 * deliberate, documented amendment to the frozen contract.
 */
import type { Article, LawDoc } from '@/types/lawlib';

export interface DigestSearchLine {
  /** 'lawlib-dline-<n>' — DOM id (GLOBAL counter, build model), NEVER a URL hash. */
  id: string;
  /** Section heading — result grouping. */
  section: string;
  /** Reconstructed line text (text + term tokens). */
  text: string;
}

export interface SearchPanelProps {
  /** Every article of the law, flattened (chapters AND sections). */
  articles: Article[];
  /** Fired with the article key (`${no}${suffix ?? ''}`) when a result is chosen. */
  onJump: (articleKey: string) => void;
  /**
   * NEW (rev 5.5): digest summary lines to search — populated only in COMPACT
   * view. Absent → digest group hidden (FULL behaves exactly as before).
   */
  digestLines?: DigestSearchLine[];
  /** NEW (rev 5.5): fired with a digest line DOM id → scroll + focus + flash. */
  onDigestLineJump?: (id: string) => void;
}

export interface GlossaryPanelProps {
  definitions: LawDoc['definitions'];
  /** Fired with the exact definition term when a term is chosen. */
  onTerm: (term: string) => void;
  /**
   * Terms that do NOT occur in any article text (firstTermArticleKey → null).
   * Optional + backward-compatible: absent → no rows disabled.
   */
  missingTerms?: ReadonlySet<string>;
}

export interface EditionTimelineProps {
  /** Amendment history, ascending by edition no (ฉ.1 = original act). */
  editions: LawDoc['editions'];
}

/** FR11 — reading preferences, persisted by the storage layer.
 *
 * CONTRACT CHANGE (T10a, ADR-019 D5): fontSize + width are now NUMBERS
 * (legacy enum strings migrate in validateReadingSettings: 's/m/l/xl' →
 * 14/16/18/24, 'narrow/normal/wide' → 80/100/120% — the width scale moved
 * from ch to PERCENT of the 80ch baseline, 80-120, default 100; legacy
 * numeric ch values [40,80) rescale linearly (+40, idempotent)).
 * lineHeight clamps [1.0, 2.0] (was [1.5, 2.2]). paperTone is NOT here —
 * it lives in ThemeProvider (`lawlib:paperTone`, number 0-100, ADR-019 D8).
 */
export type DockToolKey =
  | 'theme'
  | 'fontSize'
  | 'lineHeight'
  | 'width'
  | 'bookmark'
  | 'search'
  | 'notes'
  | 'glossary'
  | 'copy'
  | 'copyLink'
  | 'settings'
  | 'focusMode'
  | 'autoScroll';

/** T10b (ADR-019 D4): the 5 reading font families. Sarabun/Mali resolve to
 *  the existing next/font/local vars (NEVER re-@font-face them — hashed
 *  family names would double-download); the other three are raw @font-face
 *  families (globals.css) that only download when selected. */
export type ReaderFontFamily = 'sarabun' | 'noto-sans-thai' | 'mali' | 'bai-jamjuree' | 'itim';

/** T10b: body font weight — ปกติ (400) / หนา (700). */
export type ReaderFontWeight = 'normal' | 'bold';

/** T42 (ADR-025 D2) — 3-tier motion preference: quality (full durations),
 *  fast (halved via --motion-factor 0.5), disable (blanket kill). The
 *  EFFECTIVE tier also folds in OS prefers-reduced-motion (quality
 *  downgrades to fast — user-locked D2c; see effectiveMotionPreference). */
export type MotionPreference = 'quality' | 'fast' | 'disable';

export type ReadingSettingsValue = {
  /** Font size in px, 8-32 (default 16). */
  fontSize: number;
  /** Line height multiplier, 1.0-2.0 (default 1.8). */
  lineHeight: number;
  /** Content width in ch, 40-80 (default 60). */
  width: number;
  /** Dock Level-1 pinned tool keys — render order = array order (defaults to
   *  the curated row: theme/fontSize/lineHeight/width/bookmark/search/notes). */
  favoriteToolKeys: DockToolKey[];
  /** T10b: reading font family (default 'sarabun'). */
  fontFamily: ReaderFontFamily;
  /** T10b: chrome translucency 0-100% (default 35 — T12 "real glass"; the
   *  dock's Level-1 panel + collapsed icon blur-xs override, see globals.css
   *  .lawlib-glass-xs — a documented deviation from the glass-2 tier). 100 =
   *  solid + backdrop-filter:none (GPU saving). Dock + search surfaces only. */
  glassOpacity: number;
  /** T10b: toolbar size in px 24-56 (default 44). Touch devices floor at 44
   *  (WCAG 2.5.8 — enforced by the dock, not the validator). */
  toolbarSize: number;
  /** T10b: body font weight (default 'normal'). */
  fontWeight: ReaderFontWeight;
  /** T10b: hide repealed-paragraph blocks (`.lawlib-repealed`, FULL+COMPACT). */
  hideRepealed: boolean;
  /** T10b: hide amendment notes (แก้ไขโดยฉบับที่ N — the tooltip's amber
   *  block, `.lawlib-amendment-notes`). */
  hideAmendmentNotes: boolean;
  /** T10b: focus mode — hides nav/TOC/dock/footer (body class lawlib-focus). */
  focusMode: boolean;
  /** T10b: auto-scroll speed 0-5 (0 = off; pauses on user interaction). */
  autoScrollSpeed: number;
  /** T12 (ADR-019 D9): dock expand/collapse slide+fade animation (~150ms).
   *  Default ON; always skipped under prefers-reduced-motion. */
  animateDock: boolean;
  /** T42 (ADR-025 D2): 3-tier motion preference — quality / fast / disable
   *  (default 'quality'). Applied as `data-motion` on <html> by the
   *  pre-paint script + LawlibGlassVars; OS reduced-motion downgrades
   *  quality → fast (never disable unless chosen). */
  motionPreference: MotionPreference;
};

export interface ReadingSettingsProps {
  settings: ReadingSettingsValue;
  /** Full replacement object — the component never mutates partial state. */
  onChange: (next: ReadingSettingsValue) => void;
}
