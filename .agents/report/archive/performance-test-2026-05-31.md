# Performance Test Report: Boss478 Portfolio

**Date:** 2026-05-31
**Test type:** Core Web Vitals Audit + Load Test + Curl Timing
**Environment:** Local (port 3300, dev server)

---

## Summary

All 5 public pages score **31-38/100** on Lighthouse performance. The root cause is a **2,659KB main-app.js bundle** (66% of page weight) with no code splitting. Server TTFB is healthy (68-307ms warm), but client-side JS parsing/execution destroys Core Web Vitals. Concurrency degrades badly — `/games` and `/resources` timeout under even minimal load (3 connections).

---

## Core Web Vitals (Lighthouse, Headless Chrome)

| Metric | Target | `/` | `/portfolio` | `/gallery` | `/games` | `/resources` | Pass? |
|--------|--------|-----|-------------|-----------|---------|-------------|-------|
| **Performance** | ≥90 | 34 | 33 | 31 | 38 | 37 | ❌ |
| **Accessibility** | ≥90 | 96 | — | — | — | — | ✅ |
| **SEO** | ≥90 | 0 | — | — | — | — | ❌ |
| **Best Practices** | ≥90 | 0 | — | — | — | — | ❌ |
| **LCP** | <2500ms | 25,500ms | 6,700ms | 12,100ms | 5,100ms | 5,700ms | ❌ |
| **CLS** | <0.1 | 0 | 0.001 | 0.022 | 0.001 | 0.023 | ✅ |
| **TBT** | <300ms | 2,510ms | 4,710ms | 5,380ms | 4,780ms | 4,970ms | ❌ |
| **FCP** | <1800ms | 3,900ms | 2,700ms | 2,700ms | 2,500ms | 2,200ms | ❌ |
| **Speed Index** | <3000ms | 5,400ms | 30,500ms | 27,300ms | 25,100ms | 22,000ms | ❌ |
| **Page Weight** | <500KB | 4,016KB | 4,243KB | 4,244KB | 4,242KB | 4,242KB | ❌ |
| **Requests** | <50 | 22 | — | — | — | — | ✅ |

---

## Curl Timing (Warm, 3rd Round)

Server-side rendering is fast — bottleneck is entirely client-side.

| Page | TTFB | Total | HTML Size |
|------|------|-------|-----------|
| `/` | 68ms | 74ms | 45KB |
| `/portfolio` | 169ms | 182ms | 50KB |
| `/gallery` | 99ms | 127ms | 41KB |
| `/games` | 307ms | 336ms | 40KB |
| `/resources` | 178ms | 188ms | 45KB |

---

## Load Test Results (Autocannon, 3 connections, 10s)

| Page | Avg Latency | p50 | p99 | Max | Req/Sec | Total Reqs | Pass? |
|------|-------------|-----|-----|-----|---------|------------|-------|
| `/` | 964ms | 740ms | 2,209ms | 2,209ms | 2.7 | 30 | ⚠️ |
| `/portfolio` | 3,452ms | 3,457ms | 3,800ms | 3,800ms | 0.3 | 6 | ❌ |
| `/gallery` | 3,644ms | 3,249ms | 4,834ms | 4,834ms | 0.3 | 6 | ❌ |
| `/games` | timeout | — | — | — | 0 | 3 | ❌ |
| `/resources` | timeout | — | — | — | 0 | 3 | ❌ |

---

## Resource Breakdown (Homepage)

| Resource | Size | % of Total | Issue |
|----------|------|-----------|-------|
| main-app.js | 2,659KB | 66% | Single unsplit chunk — #1 bottleneck |
| Fonts (10 files) | 781KB | 19% | 6 duplicates (Geist/Mali with/without `?v=`) |
| layout.css | 51KB | 1.3% | Render-blocking (354ms delay) |
| page.js | 138KB | 3.4% | Contains unused dead code |
| webpack.js | 22KB | 0.5% | Dev artifact in production build |
| Flaticon font | 315KB | 7.8% | Largest single font, only icon set |

**Total page weight: ~4,016KB** (target: <500KB, **8× over budget**)

---

## Root Cause Analysis

1. **No code splitting** — All 5 pages ship identical ~4,242KB bundle. `main-app.js` alone is 2,659KB (React, Next.js, and all page code in one chunk).
2. **Font bloat** — 10 font files (781KB) with 6 duplicates. Flaticon icon font is 315KB for a handful of icons.
3. **Unused JS** — 138KB dead code in `page.js` shipped to client.
4. **Render-blocking CSS** — `layout.css` (51KB) delays FCP by 354ms.
5. **Dev artifact leak** — `webpack.js` (22KB unminified) appears in production build.
6. **SEO meta missing** — 0/100 SEO and Best Practices scores indicate missing `<meta>` tags.

---

## Recommendations (Priority Order)

| # | Action | Impact | Priority |
|---|--------|--------|----------|
| 1 | **Code splitting** — Enable Next.js dynamic imports per page. Split `main-app.js` into per-route chunks. | LCP: -70%, TBT: -60% | **H** |
| 2 | **Font optimization** — Deduplicate Geist/Mali fonts (remove `?v=` variants). Subset Flaticon to used glyphs only. | -400KB, FCP: -0.5s | **H** |
| 3 | **Remove dead JS** — Eliminate 138KB unused code from `page.js` bundle. | -138KB | **H** |
| 4 | **CSS optimization** — Inline critical CSS, defer non-critical `layout.css`. | FCP: -300ms | **M** |
| 5 | **Remove webpack.js** — Ensure dev-only artifacts don't leak to production. | -22KB | **M** |
| 6 | **Add SEO meta** — Add proper `<title>`, `<meta description>`, OG tags, robots.txt. | SEO: 0→90+ | **M** |
| 7 | **Font-display: swap** — Prevent invisible text during font loading. | CLS prevention | **L** |

---

## Baselines for Regression Detection

| Metric | Current | Target | Method |
|--------|---------|--------|--------|
| LCP | 25,500ms | <2,500ms | Lighthouse |
| TBT | 2,510ms | <300ms | Lighthouse |
| FCP | 3,900ms | <1,800ms | Lighthouse |
| CLS | 0 | <0.1 | Lighthouse |
| TTFB | 68ms | <800ms | curl |
| Page Weight | 4,016KB | <500KB | DevTools |
| Bundle (JS) | 2,779KB | <200KB | Bundle analyzer |
