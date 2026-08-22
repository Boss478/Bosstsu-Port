# ADR-012 — Security hardening: analytics whitelist, TTL, dictionary proxy caps

**Date:** 2026-08-03 · **Status:** Accepted (user-approved plan `.agents/plans/done/perf-security-a11y-v1.10.86.md`, shipped in v1.10.86)

## Context
The review campaign (`.agents/report/review-campaign-2026-08-03.md` §3) found three live DoS/OOM vectors on the 1vCPU/4GB VPS, all on unauthenticated public routes, plus a misconfiguration footgun. The game itself is clean (no secrets, React-escaped, localStorage-only); these are site-infra holes. The analytics client contract is fixed (`src/lib/analytics/queue.ts` — type/path/sessionId/eventName/metadata/referrer/userAgent/deviceType), which makes a server-side whitelist feasible.

## Decision 1 — Analytics per-field whitelist + caps
Replace the `...event` spread in `api/analytics/route.ts` with an explicit whitelist of the 8 client fields + derived (ipHash/timestamp/userAgent). Caps: sessionId ≤64, eventName ≤64, referrer ≤200, path ≤200 (existing), userAgent ≤200 (existing), metadata ≤500B (existing). Unknown fields dropped. Rationale: the body cap (25.6KB) bounds the request but not per-field storage cost — a multi-MB string field would reach the DB. Rejected: raising the body cap (wrong direction), client-side validation only (bypassable).

## Decision 2 — AnalyticsEvent TTL index (90d)
Replace `{timestamp: -1}` with `{timestamp: 1, expireAfterSeconds: 7776000}`. MongoDB allows ONE TTL index per collection — merged into the existing timestamp index, compounds untouched. Rationale: the collection otherwise grows forever (storage pressure on 4GB VPS); 90d retention covers reporting needs. Also closes DB-reviewer MAJOR ①.

## Decision 3 — Dictionary audio proxy: timeout + size cap + rate limit
`AbortSignal.timeout(10s)` on the upstream + both audio fetches; `content-length`/`byteLength ≤ 2MB` → skip audio, `audioUrl: null` (existing fallback shape); per-IP rate limit via existing `checkAnalyticsRateLimit` helper (120/min). Rationale: unbounded base64 accumulation in memory = OOM on 1 vCPU; the fallback shape means no client UX change on failure. Rejected: caching audio server-side (storage cost, CDN would be the real fix — out of scope).

## Decision 4 — ANALYTICS_SALT required
Route-level guard: missing salt → 500 + explicit log, never empty-salt hashing. Rationale: empty salt makes ipHash guessable (privacy/anonymity defeat); a module-load throw would break builds in env-less contexts — route-level is the minimal safe spot.

## Consequences
- Analytics events with unknown fields are dropped (forward-compat: client contract is the source of truth; `web_vitals` event uses `trackCustomEvent` → passes the same whitelist — verify in spec).
- TTL index replaces (not adds) an index — no index-count growth; background MongoDB job, zero app CPU.
- Dictionary lookups that time out / exceed cap degrade to `audioUrl: null` — identical to today's upstream-error fallback.
- Rate limit uses the existing in-memory sliding window (tiny map, lazy cleanup) — no new infra.
- Deployment: index change requires no migration (Mongo builds TTL on existing docs lazily); `syncIndexes`/model load handles it.

## Constraints honored
No pool-3 impact (zero new queries; analytics insertMany unchanged), no schema field changes, no rate-limit interaction with auth (5/15min untouched), no tools/SSE WIP files touched.
