/**
 * LawLib — zod-free constants shared between server-side validate and the
 * client reader-core.
 *
 * ZOD-FREE CONTRACT: this module is imported by client components (via
 * `src/lib/lawlib-reader.ts` → LawlibListClient / LawlibReaderClient), so it
 * MUST never import from `./validate` (or any module that pulls in `zod`) —
 * that would drag the schema lib into every lawlib client chunk. zod stays
 * confined to `validate.ts`.
 */

/**
 * Terms exempt from validate rule 3's min-length check (legitimate 3-char
 * legal terms).
 */
export const SHORT_TERM_ALLOWLIST = ['ครู'] as const;

/**
 * Authored-code aliases → canonical slug (SCRUTINY-L2 manifest dedupe).
 * "พ.ร.บ.ข้าราชการครูฯ 2547" is the AUTHORED REF FORM of the same act as
 * "พ.ร.บ.ระเบียบข้าราชการครูและบุคลากรทางการศึกษา 2547" (canonical; the
 * PDF list is 10 files, one entry in planned-laws.json). The build emits BOTH
 * forms in codeToSlug and includes alias keys in knownCodes so cross-law
 * refs using either form validate — shared by scripts/lawlib/build.ts and
 * scripts/lawlib/validate.ts so the two CLIs always agree.
 */
export const LAW_CODE_ALIASES: Record<string, string> = {
  'พ.ร.บ.ข้าราชการครูฯ 2547': 'teachers-educational-personnel-civil-service-act-2547',
};
