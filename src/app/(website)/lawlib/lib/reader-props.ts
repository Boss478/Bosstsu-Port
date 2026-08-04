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
 */
import type { Article, LawDoc } from '@/types/lawlib';

export interface SearchPanelProps {
  /** Every article of the law, flattened (chapters AND sections). */
  articles: Article[];
  /** Fired with the article key (`${no}${suffix ?? ''}`) when a result is chosen. */
  onJump: (articleKey: string) => void;
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

/** FR11 — reading preferences, persisted by the storage layer. */
export type ReadingSettingsValue = {
  fontSize: 's' | 'm' | 'l' | 'xl';
  lineHeight: number;
  width: 'narrow' | 'normal' | 'wide';
};

export interface ReadingSettingsProps {
  settings: ReadingSettingsValue;
  /** Full replacement object — the component never mutates partial state. */
  onChange: (next: ReadingSettingsValue) => void;
}
