# ADR-015 — KruLAW slugs: English translation convention

**Date:** 2026-08-04 · **Status:** Approved (slug table user-reviewed one-by-one) · **Supersedes:** the transliteration convention implicit in `planned-laws.json` (initial commit)

## Context

KruLAW pre-release: 10 planned laws, 1 built law (พ.ร.บ.การศึกษาแห่งชาติ 2542), all files untracked, `index.json` = `[]`, no production deploy. Initial slugs were Thai phoneme transliterations (`phra-ratchabanyat-kaensueksa-2542`) — unreadable, error-prone to type, and not memorable in URLs (`/krulaw/phra-ratchabanyat-rabiap-kharatchakankhru-2547`).

## Decision

**All law slugs are real English translations of the act names**, kebab-case, with the B.E. year suffix retained:

- `national-education-act-2542` (การศึกษาแห่งชาติ 2542)
- `compulsory-education-act-2545`
- `education-for-persons-with-disabilities-act-2551`
- `early-childhood-development-act-2562`
- `child-protection-act-2546`
- `salary-and-allowances-act-2547`
- `teachers-educational-personnel-civil-service-act-2547`
- `ministry-of-education-administration-act-2546`
- `teachers-council-educational-personnel-act-2546`
- `promotion-of-learning-act-2566`

Where an official English title exists (laws 1, 2, 4, 5, 7, 9, 10), the slug follows it. Laws 3, 6, 8 use the user-chosen shorter faithful translations. Years remain B.E. (2542) — Thai audience, matches gazette usage, disambiguates future re-enactments.

**Not changed:** `code` fields (พ.ร.ב. … 2542, used in `[[…|code]]` refs and `codeToSlug` keys), article `lawSlug` refs (they store codes, resolved via `codeToSlug`), the `sample` fixture slug.

## Alternatives rejected

- Keep transliteration slugs — unreadable, typo-prone, ugly URLs
- CE years (1999) — inconsistent with Thai legal reference convention; B.E. retained
- Numeric IDs — no discoverability; content is static and stable, slugs double as human-readable keys

## Consequences

- URL-friendly, memorable deep links: `/krulaw/national-education-act-2542#มาตรา-8`
- **Pre-release change → no redirects, no 301s, no SEO debt** (no production URLs ever existed)
- Hard references to update: manifest (10), build alias (1), digest page (1), eval assertions (2), digest content (1), test comments (2) — tracked in `.agents/plans/krulaw-english-slugs.md`
- Future laws: new law files MUST use the English-title convention; slug style is enforced by human review (no schema constraint — slugs only validated `[a-z0-9-]+`)
