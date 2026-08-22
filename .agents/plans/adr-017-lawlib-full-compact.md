# ADR-017 — LawLib FULL/COMPACT merge (digest into the law reader)

**Date**: 2026-08-05 · **Status**: Accepted · **Scope**: `/lawlib/[slug]`, `src/lib/lawlib/digest-view.ts`, `content/lawlib/digests/`, reader client

## Context

The digest lived on a separate `/lawlib/digest` route (one hardcoded markdown for `national-education-act-2542`) with a different feature set from the reader. The user requested merging it into `/lawlib/[slug]` as a FULL|COMPACT toggle (default COMPACT), with hover-to-full มาตรา cards, full feature parity, digest-search, and crawlable full text. Five scrutiny loops (technical/performance/security/a11y/SEO) + two senior-engineer reviews produced 38 findings, all incorporated (plan rev 5.5).

## Decisions (D1–D19)

- **D1 — View state**: `?view=compact|full` URL param (mount read wins) + per-slug key `lawlib:<slug>:view` + default `compact` when a digest exists. URL via replaceState preserving the hash. Rejected: param-only (loses persistence), local-only (not shareable), settings-field (settings are device-wide — would pollute the SettingsMenu contract).
- **D2 — Digest convention**: `content/lawlib/digests/<slug>.md`; the toggle appears only when present. Only `national-education-act-2542` ships COMPACT now; future digests are user-reviewed one by one.
- **D3 — Old route**: `/lawlib/digest` DELETED, no redirect (user decision; SEO re-index accepted — content now at `/lawlib/<slug>?view=compact`).
- **D4 — Hover-to-full**: compact cards render the REAL article via the SAME ArticleView (`singleKey` mode, h4, sole interactive header while expanded); tap/keyboard as non-hover paths; hover never moves focus.
- **D5 — Jump rule**: `navigateTo` is view-aware — card-first in compact (auto-expands collapsed groups), else FULL + deferred jump (setTimeout(0) after the DOM commits — synchronous jumps silently no-op). One rule covers chips/refs/search/glossary/TOC/bookmarks/tooltip/hash/restore.
- **D6 — Parity**: full feature parity in compact; highlights/notes/copy scoped to expanded article content (article storage model unchanged; digest summary lines inert); no firstKey default in compact.
- **D7 — Module placement**: digest render merged into the reader client (one tooltip/dock/panel state); `digest-view.ts` moved to `src/lib/lawlib/` (pure, shared server/client).
- **D8 — URL read**: `location.search` at mount in the ssr:false tree — no useSearchParams, no Suspense, consistent with the hash pattern.
- **D9 — Tokenization**: marker-aware — `**`/`~~` runs split first (bold/strike flags), terms via `splitByTerms` on plain runs only; refs untouched.
- **D10 — effectiveView** derived at render (`digestView === null → 'full'`) — covers no-digest laws + mid-session law switches.
- **D11 — Default COMPACT** (user); share links always carry the explicit param (a FULL share must say `?view=full`).
- **D12 — Crawler hybrid**: digest-bearing pages render a static full-text region (`.lawlib-static-full`, display:none — indexed per Google's hidden-content policy; `@media (scripting:none)` no-JS fallback incl. hiding the loading skeleton). Region emits NO ids and NO `data-lawlib-*` (app owns them exclusively). Measured ≈123.7KB raw / 15.4KB gzip; page total ≈295KB raw / ~38KB gzip-9 (gate ≤85KB). Canonical via `alternates` + **`metadataBase`** (without it the relative canonical resolved to localhost — silent SEO death).
- **D13 — Digest search**: COMPACT-only digest-line matches (grouped, combined status, prefixed aria-labels); jump via `onDigestLineJump` → auto-expand group → scroll+focus (`tabindex=-1`) → 2s flash; never a URL hash. FROZEN `SearchPanelProps` deliberately extended with optional `digestLines?`/`onDigestLineJump?` (documented in-file).
- **D14 — Mount restore** obeys the jump rule on fresh loads (`viewAtMount` in mountDataRef, `digestHasCard` resolution, no firstKey in compact).
- **D15 — Robustness**: `lawlib-dline-<n>` ids use ONE global counter (per-section restart collides); same-law refs = in-page buttons, cross-law refs stay Links; activeKey/expandedKey reset on law.slug change (reader keyed by slug); digestView null on parsed-empty digest; toggle eval = bash grader over built HTML.
- **D16 — Performance**: ArticleView `singleKey` short-circuits the model build (target article only) + per-law WeakMap cache; view switch scrolls to top + activeKey → null entering compact; **both-mounted-CSS-toggle rejected** (82-article DOM alive on the COMPACT-default path costs memory for marginal gain); digestLines via useMemo; static region AFTER the shell (parse order); perf budget: HTML gzip ≤85KB, no sarabun in reader chunks, toggle ≤150ms, hover no frame >50ms, LCP ≤+50ms, TTI ≤+100ms.
- **D17 — Security**: stored view value whitelisted (`'compact'|'full'` else null); no-HTML-sink grep gate (lawlib path stays React-node/escaped-attribute only); static region AC = no `id=`/`data-` at all; storage-key trust chain documented (z-schema + route regex + index membership + dynamicParams=false).
- **D18 — A11y (WCAG 2.2 AA)**: toggle = APG radio group (not aria-pressed); sr-only `role="status"` set in the toggle handler only; expanded-card focus handoff + Escape collapse rung (panel > card > dock) + collapse never on blur-while-focused; digest lines `tabindex="-1"` + focus as the jump cue; digest-search jumps auto-expand collapsed groups (else scrollIntoView no-ops on display:none); flash colors pass 3:1 on all paper tones (never ring-amber-300/bg-amber-50); reduced-motion: no flash class/transition; touch targets min-h-11 (44px), chips ≥24px.
- **D19 — SEO**: `metadataBase` in root layout, origin centralized in `CONFIG.SITE.URL` (sitemap/robots import it — VisperHost change = one place); digest-first meta description (+ same og:description); heading tree pinned (h1 law / h2 digest-title + sections / h3 groups / card button NO heading / expanded h4); static region outline h2/h3/h4 + `<p>` (no interactive roles); `?view=` variants: canonical-only, NO robots noindex on params; non-cloaking rationale documented; post-launch Search Console check.

## Rejected alternatives

| Option | Rejected because |
|---|---|
| Floating popover for full text | Popover-in-popover with term tooltips; weak mobile story; a11y complexity |
| 301 redirect for `/lawlib/digest` | User chose delete (content replaces it at the law URL) |
| Both-mounted CSS toggle | 82-article FULL DOM alive on the COMPACT-default path — memory cost for marginal gain |
| `view` in device-wide settings | Settings are device-wide by contract; per-slug key keeps the SettingsMenu untouched |
| `useSearchParams` for the view param | ssr:false tree reads location.search — no Suspense requirement |
| mousemove-timestamp hover gate | Chrome delivers mouseenter BEFORE mousemove — gate always saw stale timestamps; replaced with post-collapse suppression window (400ms) |
| State-driven line flash | Observed to never reach the card DOM at runtime (dev + prod); replaced with direct-DOM class add/remove in the jump handler |

## Consequences

- `/lawlib/digest` 404s (re-index accepted); sitemap/nav cleaned.
- New digest md → rebuild to emit (build.ts prints pairing info).
- SearchPanelProps contract amended (documented, optional props).
- Turbopack NFT build blocker fixed (upload.ts `turbopackIgnore` ×8 — pre-existing, unrelated to the merge).
