# ADR-014 (rev 2) — New products inside Boss478: KruLAW (active) + Grammar Castle (approved) + KruExam Test/Exam (deferred)

**Date:** 2026-08-03 (rev 1) · **Rev 2:** 2026-08-03 (restructure per user direction) · **Status:** Approved rev 2 — supersedes rev 1

## Revision note (rev 2 — 2026-08-03)
User restructured KruExam into two pillars and narrowed current scope:
1. **KruExam = umbrella** (2 pillars: Content [Book & Law] + Test/Exam). **LAW pillar = "KruLAW"** — own brand, own route tree, extractable.
2. **KruLAW only is in scope now.** Test/Exam pillar **deferred** (no planning/build until explicit go-signal). Grammar Castle plan unchanged (approved).
3. **Decision 2 revised below:** law content = **static JSON like DICTIONARY** (NOT DB as rev 1 said). Questions/exams (when revived) stay DB-backed.
4. **Decision 4 revised:** build order = KruLAW first → Grammar Castle → Test/Exam (deferred).
5. New: law recheck workflow (`verifiedAt` + gazetteRef), มาตรา hover-history tooltip design (user design), Sarabun law font, batch-1 = พ.ร.บ.การศึกษาแห่งชาติ 2542 (user PDFs verified text-based, 10 laws staged).

## Context
Solo dev; **no VPS until VisperHost Thailand (2 vCPU/4GB) procured** (ADR-013); DB pool 3; rate limits 5 logins/15min; 50–100 concurrency; 4GB RAM budget. User assets: 10 ภาค ข law PDFs (`~/Downloads/การศึกษา/การศึกษา/`), all text-based (verified: 0 image objects, 16–91 font objects).

## Decision 1 — Products are route+data modules inside Boss478 (unchanged)
- Route trees: KruLAW `src/app/(website)/krulaw/` · Grammar Castle `src/app/(standalone)/games/grammar-castle/` · (future Test/Exam `src/app/(website)/kruexam/`)
- **Data namespacing contract**: own collections/data dirs, never shared. KruLAW: `src/data/krulaw/` + `content/krulaw/` (static, NO collections, NO admin). GC: `src/data/grammar/` + `GrammarProgress` (Phase 3). Test/Exam (future): `KruExam*` collections.
- Extraction later = move folders + data, not rewrite.
- **Alternatives rejected**: separate repos (2× infra/auth/ops, no VPS, 4GB box can't run 2 Next apps + Mongo) · monorepo 2 apps (tooling complexity, no present benefit).

## Decision 2 (REVISED) — Content strategy by product
- **KruLAW law content = static JSON, like DICTIONARY**: `.md` sources (`content/krulaw/laws/`) → build script → validated JSON (`src/data/krulaw/laws/`) → client renders. **0 DB reads, no API routes, no admin surface.** Rationale: laws are stable reference content (amendments = ฉบับ editions, not live edits); client-side search avoids Mongo's missing Thai stemmer; zero server cost fits 4GB/no-VPS. Revisit trigger: corpus > ~50 laws or live-editing need.
- **Grammar Castle content = static JSON** (unchanged): 0 DB reads, localStorage progress.
- **Test/Exam (future) = MongoDB-backed** (unchanged rev-1 rationale): question currency/CMS editing without redeploy.

## Decision 3 — Constraints unchanged
Pool 3 · 5 logins/15min · 50–100 concurrency · no new infra (no Meilisearch/Redis/external search) · no payments · no login requirement (device-local storage for KruLAW; deviceId for future exam writes) · no voice scoring.

## Decision 4 (REVISED) — Build order
**1) KruLAW (milestone 1 — ONLY active build)** → 2) Grammar Castle (approved plan, unchanged) → 3) KruExam Test/Exam (**deferred — requires user go-signal**). KruLAW content authoring (user PDFs → .md) + recheck (researcher/curriculum-auditor) run parallel to implementation.

## Decision 5 — Extraction triggers (revisit at every milestone)
KruExam revenue · combined traffic > ~100 concurrent · separate branding/SSL/uptime · **KruLAW standalone brand demand** (its own route tree makes extraction trivial).

## Decision 6 (NEW) — KruLAW reader design commitments
- มาตรา tooltip = article text + amendment history **only when amended** (user design; no inline badges; own-number hover included)
- Glossary hover (longest-match-first) + cross-law refs (`[[มาตรา N|code]]`, lazy-loaded)
- Sarabun font for law text (local, `next/font/local`)
- Content pipeline: pdfjs-dist extraction assist (PDFs verified text-based) → .md → zod-validated JSON → `verifiedAt` + `gazetteRef` recheck gate
- Deferred (recorded): reading progress, TTS, flashcards, related-laws panel, notes export, Book pillar, EN i18n
  - ~~full-text global search~~ — **PROMOTED 2026-08-04 (SCRUTINY-L1-3)** — see dated record below

## Consequences
- Shared deploy = shared blast radius (accepted; observer + backups cover Boss478)
- One build gate: all products pass build/lint/typecheck/test/eval before any release
- No VPS → local-only code until VisperHost provisioned (ADR-013 interim)

## Constraints honored
Pool 3 unchanged · rate limits unchanged · no new infra · no new collections for KruLAW (100% static) · 50–100 concurrency envelope respected (KruLAW = zero server load; future exam pillar = read-mostly cached)

## 2026-08-04 — KruLAW L4 / SCRUTINY consolidated fix-lane records
Dated record of decisions landed by the consolidated fix lane (SCRUTINY Loop 1 + Loop 2 code findings; see `krulaw-scrutiny-log.md`):

1. **L4 — full-text global search PROMOTED** (was Decision 6 deferred): list-page search now ranks metadata hits (title/code/subject/tags/definitionTerms) first, then full-text over the built registry (lazy load-all, cached; ≤11 laws — cheap). Law-level results with top-2 มาตรา snippets clamped to วรรค boundaries, deep-linking `/krulaw/<slug>#มาตรา-N`, capped at 20 results.
2. **Manifest dedupe / alias**: "พ.ร.บ.ข้าราชการครูฯ 2547" and "พ.ร.บ.ระเบียบข้าราชการครูและบุคลากรทางการศึกษา 2547" are THE SAME act (PDF list = 10 files). Canonical = code "พ.ร.บ.ระเบียบข้าราชการครูและบุคลากรทางการศึกษา 2547" + slug `phra-ratchabanyat-rabiap-kharatchakankhru-2547` (one planned-laws entry). "พ.ร.บ.ข้าราชการครูฯ 2547" kept as the AUTHORED REF FORM via a build-time alias map (`build.ts LAW_CODE_ALIASES`) → both code forms emit in `codeToSlug` → the same canonical slug; alias keys also join `knownCodes` for cross-law ref validation.
3. **Era contract**: `verifiedAt` is stored CE (YYYY-MM-DD) in data and displayed +543 (formatVerifiedAt, string-parsed — never `new Date()`); `editions[].gazetteDate/effectiveDate` stay BE (พ.ศ.) verbatim.
4. **วรรค '\n' contract** (L1-1): blank-line-separated วรรค blocks are joined by `'\n'` TEXT tokens — BETWEEN blocks only, never leading/trailing; metadata blocks (amendment/repealed markers) skipped; `articlePlainText` join unchanged, so plain text naturally contains '\n' (snippets/highlights/print all split on it).
5. **Marker semantics** (L1-2/L1-7): EVERY '>' line of a block is scanned against AMENDED_BY_RE/REPEALED_RE (multi-marker blocks → multiple amendedBy entries); AMENDED_BY_RE accepts an optional `วรรค<ordinal>` prefix (`> วรรคห้า เพิ่มโดยฉบับที่ 3` → note `เพิ่มวรรคห้า`); bare markers get the trailing text after "ฉบับที่ N" as note (no full-marker duplication). New validate rule 10 flags stray '>' lines at build.
6. **Part taxonomy (ภาค ก / ข)**: unchanged — classification source still pending researcher (no new decision).
7. **Print font (NFR1/L1-4)**: print documents embed Sarabun Regular as a base64-inline woff2 (committed generated module, lazily imported — no Google Fonts CDN in print output).
