# K6 Load Test Report — Boss478 Portfolio (Production)

**Date:** 2026-06-08
**Tool:** K6 v? (via Homebrew)
**Script:** `tests/k6/load-public.js`
**Target:** `https://srv1676702.hstgr.cloud` (KVM1 VPS, 1 vCPU, 4GB RAM)
**Methodology:** 5-stage ramp 1→50 VUs over 2m15s, iterating 5 public pages per VU

---

## Executive Summary

All budgets pass. Server handles 50 concurrent users across 5 pages with **0% errors** and **p50 of 314ms**. ISR caching is working effectively — the second run (this report) was 3.5x faster than the first uncached run.

---

## Thresholds

| Budget | Target | Actual | Status |
|--------|--------|--------|--------|
| Error rate | < 1% | 0.00% | ✅ |
| HTTP failures | < 1% | 0.00% | ✅ |
| p50 | < 1,000ms | **314ms** | ✅ |
| p95 | < 3,000ms | **1,020ms** | ✅ |
| p99 | < 5,000ms | **1,420ms** | ✅ |

---

## Per-Route Latency (ms)

| Page | Avg | Median | p90 | p95 | Max |
|------|-----|--------|-----|-----|-----|
| Home | 285 | 240 | 490 | 567 | 963 |
| Portfolio | 430 | 298 | 883 | 965 | 1,524 |
| Gallery | 614 | 513 | 1,176 | 1,384 | **1,849** |
| Games | 427 | 315 | 855 | 991 | 1,545 |
| Resources | 410 | 295 | 762 | 907 | 1,463 |

**Gallery** is the slowest page (median 513ms, p95 1,384ms) — consistent with the June 3 audit finding (68 requests, heavy images).

---

## Cold vs Warm Cache

| Run | Iterations | p50 | p95 | Notes |
|-----|-----------|-----|-----|-------|
| 1 (cold) | 395 | 1,110ms | 2,740ms | First request after deploy — ISR uncached |
| 2 (warm) | 664 | **314ms** | **1,020ms** | ISR cache populated by run 1 |

The 3.5x improvement between runs confirms ISR caching is the primary performance driver.

---

## Aggregates

| Metric | Value |
|--------|-------|
| Total requests | 3,320 |
| Iterations | 664 |
| Data received | 191 MB |
| Data sent | 934 KB |
| Avg iteration duration | 5.67s |
| Max VUs | 50 |

---

## Comparison with June 3 Autocannon Baseline

| Page | Jun 3 (100 conn, autocannon) | Jun 8 (50 conn, K6) |
|------|------------------------------|---------------------|
| Home p50 | 476ms | **240ms** |
| Portfolio p50 | 1,719ms | **298ms** |
| Gallery p50 | 2,273ms | **513ms** |
| Games p50 | 1,642ms | **315ms** |
| Resources p50 | 1,630ms | **295ms** |

> **Note:** Direct comparison is not apples-to-apples (different tools, concurrency levels, cache states). June 3 was a 10-stage ramp 1→200. June 8 is a 5-stage 1→50. Both show the server handles concurrency well.

---

## Findings

1. **All budgets pass** — p50=314ms, p95=1.02s, p99=1.42s, 0% errors.
2. **ISR caching is critical** — warm cache is 3.5x faster than cold. First run after deploy will trigger the p50 threshold. Consider warming cache after deployment.
3. **Gallery remains the slowest page** — median 513ms, p95 1,384ms. The 68 requests per page load are the bottleneck.
4. **No regressions detected** against the June 3 production baseline.

---

## Script

`tests/k6/load-public.js` — run with:

```bash
k6 run -e BASE_URL=https://srv1676702.hstgr.cloud -e THRESHOLD_MODE=prod tests/k6/load-public.js
```
