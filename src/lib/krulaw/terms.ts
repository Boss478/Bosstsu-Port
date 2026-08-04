/**
 * KruLAW — zod-free constants shared between server-side validate and the
 * client reader-core.
 *
 * ZOD-FREE CONTRACT: this module is imported by client components (via
 * `src/lib/krulaw-reader.ts` → KrulawListClient / KrulawReaderClient), so it
 * MUST never import from `./validate` (or any module that pulls in `zod`) —
 * that would drag the schema lib into every krulaw client chunk. zod stays
 * confined to `validate.ts`.
 */

/**
 * Terms exempt from validate rule 3's min-length check (legitimate 3-char
 * legal terms).
 */
export const SHORT_TERM_ALLOWLIST = ['ครู'] as const;
