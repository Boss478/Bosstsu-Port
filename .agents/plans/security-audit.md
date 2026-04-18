# Security Audit & Hardening Plan (VPS-Optimized)

> **Scope:** Security hardening for a low-resource VPS (1 vCPU, 4GB RAM, 50GB NVMe) running multiple services simultaneously. All fixes are lightweight — no additional dependencies, no Redis, minimal memory footprint.

**Project:** Boss478 Portfolio (Next.js 16 + MongoDB)
**Date:** 2026-04-07
**Current Version:** 1.5.6
**Done Version:** 1.5.9
**Status:** **COMPLETE** (2026-04-07)

**VPS Constraints:**
- 1 vCPU — no blocking operations, no heavy computation
- 4GB RAM shared across 3+ services — Map caps must be small (< 50 entries)
- Next.js limited to 1024MB (docker-compose.yml)
- MongoDB limited to 1536MB
- 50-100 concurrent users max

---

## Executive Summary

8 security issues identified. All fixes use zero-dependency, in-memory approaches with strict memory bounds. Total estimated added memory: < 1MB.

### Positive Findings (Already Well-Done)
- Admin routes protected by middleware with httpOnly, secure, sameSite=strict cookies
- Server actions verify auth before mutation operations
- Zod schema validation on all admin CRUD actions
- DOMPurify sanitizes HTML content before DB storage
- CSP headers configured with security-restrictive defaults
- File uploads use UUID filenames (no path traversal)
- Sharp reprocessing re-encodes images, stripping hidden payloads
- Idle timeout + auto-logout in AdminSessionProvider
- `.env*` in `.gitignore` (secrets not committed)
- MongoDB connection pool capped at 3 (`maxPoolSize: 3`)

---

## Issues by Priority

### P0 — CRITICAL (Must Fix)

#### 1. Login Brute Force: No Rate Limiting
**File:** `src/app/admin/login/actions.ts`

**Problem:** `loginAdmin()` accepts unlimited password attempts. An attacker can brute-force the single password in seconds.

**Fix (VPS-optimized):**
- Create `src/lib/rate-limit.ts` — single Map-based limiter
- Track failed attempts per IP: 5 attempts per 15 minutes, then 15-min lockout
- Map capped at 20 IPs — evict oldest when full (lazy cleanup, no timers)
- Use `x-forwarded-for` header for client IP
- Memory cost: ~3KB max

#### 2. `pyodide-input` API: No Auth, Unbounded Memory
**File:** `src/app/api/pyodide-input/route.ts`

**Problem:** Both endpoints are public. The `pendingInputs` Map grows unbounded — anyone can POST spam and exhaust server memory.

**Fix (VPS-optimized):**
- Add `verifyAuth()` check to POST endpoint
- Validate input: `id` max 36 chars, `value` max 1000 chars
- Cap Map at 50 entries — evict oldest when exceeding
- Reduce GET timeout from 30s to 15s
- Memory cost: ~100KB max (was unlimited)

#### 3. Vulnerable Dependencies
**File:** `package.json`

**Known vulnerabilities:**
- DOMPurify < 3.3.2 — XSS bypass (we use it for HTML sanitization)
- Next.js 16.1.6 — CSRF bypass, HTTP smuggling
- flatted < 3.4.0 — prototype pollution, DoS
- undici < 7.24.0 — DoS, CRLF injection, smuggling
- picomatch < 2.3.2 — ReDoS
- brace-expansion < 1.1.13 — memory exhaustion

**Fix:** `npm update isomorphic-dompurify next flatted picomatch undici brace-expansion`

---

### P1 — HIGH (Should Fix)

#### 4. Mongo-Express Basic Auth Disabled
**File:** `docker-compose.yml` (line 55)

**Problem:** `ME_CONFIG_BASICAUTH=false` — no auth on mongo-express.

**Fix:**
```yaml
- ME_CONFIG_BASICAUTH=true
- ME_CONFIG_BASICAUTH_USERNAME=${MONGO_EXPRESS_USERNAME}
- ME_CONFIG_BASICAUTH_PASSWORD=${MONGO_EXPRESS_PASSWORD}
```

#### 5. Error Messages Leak Server Details
**Files:** `src/app/api/upload/route.ts:49-52`, `src/app/actions/portfolio.ts:67-69`

**Problem:** Raw error messages expose internal paths and implementation details.

**Fix:** Return generic Thai error messages. Log full details via `console.error` only.

#### 6. `.env.example` Contains Realistic Credentials
**File:** `.env.example`

**Problem:** `password123`, `boss478admin` might be copy-pasted without being changed.

**Fix:** Replace with obvious placeholders (`YOUR_ADMIN_PASSWORD_HERE`, etc.)

---

### P2 — LOW (Nice to Have)

#### 7. CSP: `unsafe-inline` / `unsafe-eval` Weakened
**File:** `next.config.ts:44`

**Status:** Known limitation for dev. `unsafe-eval` is needed by React Compiler. Can be tightened when deploying production build. No action needed now.

#### 8. `addCustomTag` Dynamic Regex
**File:** `src/app/actions/tags.ts:22-24`

**Problem:** Builds RegExp from user input (currently escaped, but still dynamic).

**Fix:** Replace regex with MongoDB `$expr` + `$toLower` for case-insensitive exact match — shifts work to DB, zero client CPU.

---

## Implementation Order

### Phase 1: Critical
1. **Update dependencies** — `npm update` (rebuild dev server after)
2. **Add rate limiting** — `src/lib/rate-limit.ts` + update `loginAdmin()`
3. **Secure pyodide-input API** — add auth, cap Map, validate input

### Phase 2: Hardening
4. **Mongo-Express auth** — update `docker-compose.yml` + `.env.example`
5. **Generic error messages** — update upload route + portfolio actions
6. **Fix `.env.example`** — remove realistic passwords

### Phase 3: Cleanup
7. **CSP comment** — document why `unsafe-eval` is needed
8. **Simplify tag query** — replace regex with `$expr`

**Total changes:** ~100 lines across 6 files. 1 new file (`lib/rate-limit.ts`).

---

## VPS Resource Impact

| Fix | Added Memory | Added CPU |
|-----|-------------|-----------|
| Rate limiting | < 3KB | ~0.01ms/request |
| Pyodide API cap | -100KB (saves memory) | ~0.01ms/request |
| Dep updates | ~0 (patches only) | ~0 |
| Mongo-Express auth | ~0 (internal) | ~0 |
| Error messages | ~0 | ~0 |
| Tag query cleanup | ~0 | ~0 (shifts to MongoDB) |
| **Total** | **< 5KB** | **negligible** |

---

## Risk Assessment

| Risk | Likelihood | Impact | Priority |
|------|-----------|--------|----------|
| Brute force admin password | High | Critical | P0 |
| Pyodide API memory exhaustion | Medium | High | P0 |
| DOMPurify XSS bypass | Medium | Medium-High | P0 |
| Mongo-Express no auth | Low-Medium | Critical | P1 |
| Error info disclosure | Low | Low-Medium | P1 |
| Weak env passwords | Medium | Medium | P1 |

---

## Notes

- All solutions are **zero-dependency** — no `npm install` except dep updates
- Rate limiting uses **lazy cleanup** — no setInterval, no background threads
- `verifyAuth()` from `src/lib/auth.ts` is reused — no new auth code
- Compatible with single-process Next.js (no distributed state needed)
