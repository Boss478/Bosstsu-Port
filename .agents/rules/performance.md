# Performance Budget — Boss478 Portfolio

**Latest update:** 2026-06-03 | **Targets based on:** Production Lighthouse v13.3 audit

---

## Budget Definition

### Core Web Vitals (Hard Budgets — Block on Critical)

| Metric    | Warning Threshold | Critical (Block) | Measurement Method |
| --------- | ----------------- | ---------------- | ------------------ |
| **LCP**   | > 2,500ms         | > 3,000ms        | Lighthouse desktop |
| **CLS**   | > 0.1             | > 0.15           | Lighthouse desktop |
| **TBT**   | > 300ms           | > 500ms          | Lighthouse desktop |
| **FCP**   | > 1,800ms         | > 2,500ms        | Lighthouse desktop |
| **TTFB**  | > 800ms           | > 1,500ms        | curl / Lighthouse  |
| **Perf**  | < 80              | < 70             | Lighthouse desktop |
| **A11y**  | < 90              | < 80             | Lighthouse desktop |

### Resource Budgets (Soft — Warning Only)

| Resource    | Max | Notes                         |
| ----------- | --- | ----------------------------- |
| Page weight | 1MB | Total transferred (all assets) |
| JS total    | 600KB | First-load JS (gzipped)       |
| CSS total   | 200KB | All CSS files                  |
| Fonts       | 400KB | `next/static/media/`           |
| Requests    | 80   | Total HTTP requests            |

### Load Testing Budgets

| Metric    | Target           |
| --------- | ---------------- |
| p50 @ 50 conn | < 1,000ms     |
| p95 @ 50 conn | < 3,000ms     |
| p99 @ 50 conn | < 5,000ms     |
| Error rate @ 50 conn | < 1%      |
| Concurrency ceiling | > 100 users  |

---

## Baseline (2026-06-03)

### Lighthouse CWV (Production)

| Page | Perf | A11y | SEO | LCP(ms) | CLS | TBT(ms) | FCP(ms) | TTFB(ms) | Weight(KB) | Reqs |
|------|------|------|-----|---------|-----|---------|---------|----------|-----------|------|
| `/` | 77 | 96 | 100 | 1,023 | 0.016 | 287 | 628 | 61 | 582 | 36 |
| `/portfolio` | 65 | 86 | 100 | 783 | 0.016 | 648 | 383 | 113 | 589 | 36 |
| `/gallery` | 84 | 86 | 100 | 986 | 0.016 | 183 | 346 | 68 | 805 | 68 |
| `/games` | 61 | 86 | 100 | 893 | 0.016 | 948 | 413 | 98 | 643 | 39 |
| `/resources` | 89 | 86 | 100 | 849 | 0.016 | 103 | 437 | 96 | 590 | 38 |

### Stress Test Ceilings (Production, autocannon)

| Page | 100 conn p50 | 100 conn p99 | 100 conn err% | Ceiling |
|------|-------------|-------------|--------------|---------|
| `/` | 476ms | 1,445ms | 0% | 200+ |
| `/portfolio` | 1,719ms | 5,133ms | 0% | ~150 |
| `/gallery` | 2,273ms | 5,654ms | 0% | ~150 |
| `/games` | 1,642ms | 4,988ms | 0% | ~150 |
| `/resources` | 1,630ms | 4,587ms | 0% | ~150+ |

### Build Bundle Breakdown

| Category | Files | Size (KB) |
| -------- | ----- | --------- |
| JS chunks | 50 | 1,913 |
| CSS chunks | 3 | 186 |
| Fonts (media) | — | 344 |
| **Total static** | **53** | **2,443** |

Largest JS chunks: 277KB, 227KB, 113KB, 110KB, 97KB, 82KB

---

## Regression Detection

Check these values before/after any change:

```bash
# Lighthouse
npx lighthouse https://srv1676702.hstgr.cloud/ --preset=desktop --output=json | jq '.audits["largest-contentful-paint"].numericValue, .audits["cumulative-layout-shift"].numericValue, .audits["total-blocking-time"].numericValue'

# Page weight
curl -so /dev/null -w '%{size_download}' https://srv1676702.hstgr.cloud/

# TTFB
curl -so /dev/null -w '%{time_starttransfer}' https://srv1676702.hstgr.cloud/
```

| Signal | Investigate if... |
| ------ | ----------------- |
| LCP +500ms or more | Render-blocking resources, server-side regression |
| CLS +0.03 or more | Images missing dimensions, layout shift introduced |
| TBT +200ms or more | New JS bundle, heavy components, third-party scripts |
| Page weight +20% | New assets, unoptimized images, bundle bloat |
| Requests +20 | New external resources, missing cache headers |
| Concurrency ceiling -25 | Server config change, new blocking middleware, DB pool |

---

## Enforcement

| Level | Trigger | Action |
| ----- | ------- | ------ |
| **Block** | LCP > 3,000ms or CLS > 0.15 or Perf < 70 | CI pipeline fails. Must fix before merge. |
| **Warn** | LCP > 2,500ms or TBT > 300ms or Perf < 80 | CI prints warning. Manual review required. |
| **Info** | Any degradation from baseline | Logged in report. No action required. |

---

## Related

- Last report: `.agents/report/performance-2026-06-03.md`
- Budget config: `lighthouserc.js` (project root)
- CWV optimization: see `web-performance` skill
