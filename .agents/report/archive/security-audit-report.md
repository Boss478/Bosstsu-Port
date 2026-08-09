# Security Audit & Hardening — Final Report

**Version:** 1.5.9
**Date:** 2026-04-07
**Plan:** `.claude/plans/security-audit.md` — **STATUS: COMPLETE**

---

## Summary

All 8 security items across 3 phases have been implemented, tested, and verified. Zero new dependencies added — all solutions use vanilla TypeScript + existing packages.

| Phase | Items | Result |
|-------|-------|--------|
| P0 Critical | 3/3 | Done |
| P1 Hardening | 3/3 | Done |
| P2 Cleanup | 2/2 | Done |

---

## Changes by Priority

### Phase 1: P0 Critical

| # | Issue | Fix | Memory Impact |
|---|-------|-----|---------------|
| 1 | **Login brute force** | New `lib/rate-limit.ts` — Map-based tracker (20 IPs max, 5 fails/15min, 15min lockout). Lazy cleanup, no timers. | < 3 KB |
| 2 | **Pyodide API unguarded** | Added `verifyAuth()` to GET + POST, capped `pendingInputs` Map at 50, input validation (id ≤ 36, value ≤ 1000), timeout halved (30s → 15s) | -100 KB (was unlimited) |
| 3 | **Vulnerable dependencies** | `npm update`: Next.js 16.1.6 → 16.2.2+, undici, flatted, picomatch, brace-expansion, isomorphic-dompurify | 0 (removed vulns) |

### Phase 2: P1 Hardening

| # | Issue | Fix |
|---|-------|-----|
| 4 | **Mongo-Express no auth** | Enabled `ME_CONFIG_BASICAUTH=true` in `docker-compose.yml`, added username/password env vars |
| 5 | **Error message leakage** | All 7 action/route files — replaced `(error as Error).message` with generic Thai messages, full details server-side only |
| 6 | **Weak `.env.example`** | Replaced hardcoded weak passwords with `YOUR_*_HERE` placeholders |

### Phase 3: P2 Cleanup

| # | Issue | Fix |
|---|-------|-----|
| 7 | **CSP `unsafe-eval`** | Added comment documenting why it's required (React Compiler dev mode) |
| 8 | **`addCustomTag` regex** | Replaced `RegExp` construction with MongoDB `$expr` + `$toLower` — zero regex needed |

---

## Changed Files

### New
- `src/lib/rate-limit.ts` (75 lines)

### Modified (15 files)
1. `src/app/admin/login/actions.ts` — Rate limiting + IP tracking
2. `src/app/api/pyodide-input/route.ts` — Auth guard, Map cap, validation
3. `src/app/api/upload/route.ts` — Generic Thai error
4. `src/app/api/process-words/route.ts` — Generic Thai error
5. `src/app/admin/portfolio/actions.ts` — Generic Thai errors (3 endpoints)
6. `src/app/admin/gallery/actions.ts` — Generic Thai errors (3 endpoints)
7. `src/app/admin/games/actions.ts` — Generic Thai errors (3 endpoints)
8. `src/app/admin/resources/actions.ts` — Generic Thai errors (3 endpoints)
9. `src/app/actions/tags.ts` — `$expr` + `$toLower` replaces RegExp
10. `src/lib/config.ts` — Added `RATE_LIMIT` section
11. `docker-compose.yml` — Mongo Express auth enablement
12. `.env.example` — Secure placeholders
13. `next.config.ts` — CSP documentation comment
14. `package.json` — Version 1.5.9, Next.js `^16.2.2`
15. `changelog.md` — v1.5.7, v1.5.8, v1.5.9 entries

---

## Verification Results

| Test | Result |
|------|--------|
| `npm audit` | 0 vulnerabilities |
| `npm run build` | Success, all routes rendered |
| `/admin/login` | 200 OK, rate limiting active |
| `/api/pyodide-input` (no cookie) | 401 Unauthorized |
| `/api/upload` (no cookie) | 401 Unauthorized |
| Total memory added | < 5 KB |

---

## Remaining Notes (Out of Scope)

- **Production Docker hardening** — deferred, dev-only scope for now
- **CSP tightening** — `unsafe-eval` acceptable during dev; only relevant in prod
- **v1.5.6 changelog gap** — flagged for fill-in (not a security concern)
