# ADR-014: Blog Feature — Key Decisions

Status: **Proposed** (2026-08-03) — pending user approval + senior-engineer review
Scope: New `/blog` tab — personal bilingual blog with admin CMS (see `.agents/plans/blog-page-plan.md`)

---

## D1. Content model: optional `*En` fields on one document
**Decision:** `BlogPost` has primary TH fields (`title/excerpt/content`) + optional `titleEn/excerptEn/contentEn`, plus `lang: 'th'|'en'|'both'`.
**Alternatives rejected:** separate TH/EN documents (duplication, cross-linking pain); fully localized subdocs (over-engineered).
**Why:** Matches site's TH-primary bilingual pattern; one search index covers both; reader toggle is a field swap, no joins.

## D2. Scheduled publishing: lazy check-on-read, no cron
**Decision:** Public queries match `{ status: 'published' }` OR `{ status: 'scheduled', scheduledAt: { $lte: now } }`. No timers/cron.
**Alternatives rejected:** node-cron process (extra moving part on 1 vCPU); Vercel cron (no VPS); DB TTL tricks (unreliable).
**Why:** Zero new infra; post appears at first read after its time — acceptable for a personal blog. Server clock is source of truth.

## D3. Delete safety: soft-delete trash first, permanent delete gated
**Decision:** `deletedAt` soft delete; trash tab in admin with restore; permanent delete requires explicit confirm dialog; JSON export provides backup.
**Alternatives rejected:** hard delete everywhere.
**Why:** Project DB rules (previous data-loss incident must never repeat).

## D4. Reactions stored as a map on the post doc
**Decision:** `reactions: Record<emoji, number>` on `BlogPost`, toggled via `$inc` (bounded ≥ 0). Voter uniqueness = localStorage flag + IP rate limit (5/15min).
**Alternatives rejected:** separate reactions collection (joins, cleanup); visitor accounts (no auth infra, out of scope).
**Why:** 1 write per click, zero reads beyond the post query; contention negligible at 50–100 users.

## D5. Comments: moderated queue, name required
**Decision:** `BlogComment` with `status: pending/approved/rejected`; posting requires name (email optional), honeypot + rate limit 3/15min/IP; admin approves before public display; per-post `showComments` toggle.
**Alternatives rejected:** instant publish (spam risk on public site); third-party comments (data leaves host, privacy).
**Why:** No visitor auth exists; moderation is the only safe model and matches the admin CMS workflow.

## D6. Layout system: admin default + visitor override
**Decision:** Admin default stored in new `SiteSetting.blogLayout` (key-value collection, module cache TTL 5 min); visitors override via localStorage `blogLayout` (client shell only — hydration rule).
**Alternatives rejected:** env var (not admin-editable); visitor-only (no default control).
**Why:** One small model serves admin settings (also `reactionsSet` emoji list); cache keeps DB cost ≈ 1 query per 5 min.

## D7. Markdown rendered server-side, LRU-cached
**Decision:** Store markdown in DB; render to HTML server-side (lightweight renderer + syntax highlighter — exact libs pending senior-engineer/performance review); bounded in-memory LRU cache (~50 entries, keyed slug+lang).
**Alternatives rejected:** client-side markdown bundle (CWV regression on 1 vCPU, weaker SEO); pre-rendered HTML stored in DB (edit flow complexity).
**Why:** Small server CPU cost at 50–100 users; fast first paint; SEO-friendly.

## D8. View stats: reuse existing analytics pipeline
**Decision:** Public = `viewCount` `$inc` (1 per visit, session-deduped, debounced). Admin detail (views, reads, avg time, daily/weekly) = existing `AnalyticsEvent` model + existing admin analytics pages; per-post CSS bar chart on edit page.
**Alternatives rejected:** new stats collections (duplicate infra); chart library (bundle weight).
**Why:** AnalyticsEvent + admin analytics already exist and are proven; CSS bars keep zero new deps.

## D9. Password gate without visitor accounts
**Decision:** `passwordHash` (bcrypt) on post; reader submits password → server verifies → returns content; sessionStorage flag unlocks reveal. Private posts = hard-hidden (404), no interaction with gate.
**Alternatives rejected:** visitor accounts/roles (heavy); client-side only check (insecure).
**Why:** Password is shareable link-level protection, not auth — cheap and sufficient.

## D10. Deployment reality
**Decision:** Everything tested locally only. **No VPS until VisperHost provisioned** (ADR-013, procurement in progress; Hostinger KVM1 expired 2026-08). DB pool stays 3; admin auth rate limit unchanged (5/15min).

---

## Constraints honored
- 1 vCPU / 4GB (future VisperHost 2 vCPU / 4GB) — no cron, no edge DB, no heavy bundles
- DB pool 3 — max 4 queries/post page, batched Promise.all
- 5 logins / 15 min — admin auth untouched
- 50–100 concurrency — server-rendered RSC, cached markdown, cheap $inc writes
