# Performance Review — A/B Benchmark: OLD (54fa6af, v1.11.1-b) vs NEW (17c03ab, v1.12.0)

Date: 2026-08-08 | Perf agent (read-only, no source changes, no commits)

## Summary: 0 Critical, 2 High, 4 Medium
- **REGRESSED (High)**: Cold build wall +180% / CPU +68% (NEW, under rising host load — see caveats)
- **IMPROVED (High)**: Prod idle RSS -75%, dev startup -67%, dev idle RSS -73%
- **IMPROVED (Medium)**: Build max RSS -22%, prod under-load RSS -9%..-32%, CWV score 0.78→0.81 (LCP 5.7→5.2s), k6 tools p95 -6%
- **NEUTRAL (Medium)**: k6 err 0% both, req/s parity, CLS 0.00 both, static pages 38/38
- **MIXED (Medium)**: public-k6 p95 +15% & CPU max +12pp (NEW), tools max latency +202% (single 390ms outlier)

## Methodology
- Same machine (MacBook, darwin/arm64), same runtime **node v24.19.0** (PATH prefixed both sides), ports **3310 dev / 3311 prod** (3300 held by Docker). Both dev scripts hardcode `-p 3300`, so `npx next dev -p 3310` was used on both sides (identical effective command). `PORT=3311 npm run start` for prod.
- OLD in isolated worktree `/private/var/.../T/opencode/boss478-old-54fa6af` (next 16.2.12, react 19.2.3, mongoose 9.8.0), `npm ci` from its lockfile. NEW in main repo (next 16.3.0, react 19.2.8, mongoose 9.9.1). Env vars passed inline (`.env` is untracked; MONGODB_URI rewritten to 127.0.0.1).
- **Environment repair (no data touched)**: MongoDB was DOWN at start — Docker VM disk 100% full caused mongod abort(133) on journal `pwrite` (`WiredTigerTmplog`). Fixed: `docker builder prune` (2.9GB cache) + `docker compose up -d mongo` (same named volume `boss478_mongo_data`, port binding repaired). K6LOAD session `6a6f686f4e0e9f304ad1a7bb` verified (`sessionCode=K6LOAD`, isActive, responseCount 0).
- k6 v2.1.0; tools-live = temp copy with 50-VU stages + `code=K6LOAD` (poll route PII gate); load-public.js stock with `THRESHOLD_MODE=prod` (50-VU cap built in). Summary exported to JSON, thresholds evaluated by k6.
- CWV: Lighthouse 13.4.1 (npx, headless Chrome, mobile preset w/ default throttling), 1 run per side, page **/portfolio** (chosen: only public page set with next/image usage — `PortfolioClient.tsx`).
- Prod RSS/CPU sampled every 5s during each k6 run (max + avg recorded).

## Host-state evidence (per run)
| Run | load avg (1m) | >50% non-browser CPU procs |
|---|---|---|
| Session start | 6.59 | iTerm2 107.5%, duetexpertd 85.9% |
| OLD cold build | 4.67 | iTerm2 109.7% |
| OLD dev probe | 7.65 | iTerm2 109.7% |
| OLD prod+k6 suite | 4.74→3.84 | iTerm2 108% |
| OLD CWV | 5.12 | iTerm2 ~110% |
| NEW cold build | 5.12→~17 (rising) | iTerm2 109.6%, opencode2 up to 58% |
| NEW warm build | 16.78 (spike) | iTerm2 114.8%, opencode2 58.3% |
| NEW dev probe (1st, excluded) | 16.63 | iTerm2 116.6%, opencode2.exe 95% |
| NEW dev probe (redo, reported) | 8.12 | iTerm2 ~110% |
| NEW prod+k6 suite | 4.21 (falling) | iTerm2 110.8% |
| NEW CWV | 3.93 | iTerm2 ~110% |

No game/League processes observed. User interactive processes (iTerm2, opencode) were >50% CPU throughout — noted per quiet-host gate, not aborted.

## Build (cold: `rm -rf .next` before; `/usr/bin/time -l npm run build`)
| Metric | OLD | NEW | Δ |
|---|---|---|---|
| Wall time | 55.6s | 155.7s | **+180%** |
| CPU time (user+sys) | 78.2s | 131.7s | **+68%** |
| Max RSS | 965MB | 757MB | **-22%** |
| Next compile time | 32.7s | 107s | +227% |
| Static pages | 38 | 38 | 0 |
| NEW warm (bonus) | — | 31.5s wall, 45.7s CPU, 477MB RSS | — |

## Dev server (port 3310)
| Metric | OLD | NEW | Δ |
|---|---|---|---|
| Time-to-ready (first 200) | 3.9s @load 7.65 | 1.3s @load 8.12 | **-67%** |
| Idle RSS (3 samples) | 91.0/96.1/96.1MB (avg 92.2) | 39.9/19.1/19.1MB (avg 25.4) | **-73%** |

## Prod server (port 3311)
| Metric | OLD | NEW | Δ |
|---|---|---|---|
| Idle RSS (3 samples) | 178.6/149.0/130.2MB (avg 149.0) | 28.4/27.6/59.9MB (avg 37.7) | **-75%** |
| tools-k6 RSS avg/max | 79.7 / 145.1MB | 72.1 / 98.5MB | -9.6% / **-32%** |
| tools-k6 CPU avg/max | 2.1% / 18.1% | 1.3% / 3.7% | -0.8pp / -14.4pp |
| public-k6 RSS avg/max | 235.5 / 313.4MB | 193.1 / 296.1MB | **-18%** / -5.5% |
| public-k6 CPU avg/max | 16.5% / 30.0% | 18.6% / 42.2% | +2.1pp / +12.2pp |

## k6 latency/throughput (thresholds: tools p95<500ms; public prod p50<1000, p95<3000, p99<5000 — all PASSED on both)
| Metric | OLD | NEW | Δ |
|---|---|---|---|
| tools reqs / rate | 336 / 3.34/s | 341 / 3.38/s | +1.5% |
| tools avg / p90 / p95 / max | 9.26 / 12.97 / 15.96 / 129.1ms | 10.21 / 11.48 / 14.99 / 390.0ms | +10.2% / -11.5% / **-6.1%** / +202% |
| tools err% | 0% | 0% | 0 |
| public reqs / rate | 5255 / 38.02/s | 5240 / 37.90/s | -0.3% |
| public avg / p90 / p95 / max | 9.48 / 18.65 / 22.27 / 154.5ms | 9.84 / 19.96 / 25.58 / 132.6ms | +3.8% / +7.0% / +14.9% / **-14.1%** |
| public err% | 0% | 0% | 0 |

## Core Web Vitals — /portfolio (Lighthouse mobile, 1 run each)
| Metric | Budget | OLD | NEW | Δ |
|---|---|---|---|---|
| Perf score | — | 0.78 | 0.81 | +0.03 |
| FCP | — | 1.5s | 1.1s | **-27%** |
| LCP | <2.5s | 5.7s | 5.2s | -9% (both over budget — localhost + throttled mobile) |
| CLS | <0.1 | 0.00 | 0.00 | 0 |
| TBT (INP proxy) | — | 30ms | 40ms | +33% |
| Speed Index | — | 3.1s | 2.5s | -19% |
| TTI | — | 5.9s | 5.6s | -5% |

## Verdict
- **Improved**: prod idle RSS (-75%), dev startup (-67%) and idle RSS (-73%), build max RSS (-22%), prod under-load RSS (both tests, -10%..-32%), k6 tools p95 (-6%), public max (-14%), CWV score/FCP/LCP/SI/TTI, err% 0/0.
- **Regressed**: cold build wall +180% and CPU +68% (partly host-load-confounded; CPU-time delta is load-robust, so a real build regression is likely on next 16.3); public-k6 p95 +15%; public-k6 CPU max +12pp; TBT +10ms.
- **Neutral**: req/s parity, CLS 0/0, static pages 38/38, k6 error rates 0/0.

## Fairness caveats
1. **Host load skew**: NEW cold build ran while load rose 5→17; NEW warm build at 16.8; NEW dev 1st probe at 16.6 (excluded, redo at 8.12 reported). k6 suites ran at comparable load (OLD 3.8-4.7, NEW 4.2) — k6 comparison is the least confounded. iTerm2 (~108-117%) + opencode2 (up to 95%) present throughout; noted, not aborted (per gate, not the game).
2. Same node v24.19.0, same ports, same k6 files, same Lighthouse config both sides; OLD built first (cold page-cache), NEW second — cache state favors NEW, making the build regression conservative.
3. OLD tools-k6 had one failed attempt (corrupted temp file from an output-filter mangling — excluded); both reported runs use the identical clean 50-VU script.
4. Mongod was recovered mid-session (disk-full abort → pruned 2.9GB Docker build cache, recreated container on same volume, no data touched); session verified live before both k6 tools runs.
5. Single CWV run per side — indicative, not statistically significant.

## Cleanup (verified)
- OLD worktree removed (`git worktree remove --force`); main repo: branch `env-nextjs-16.3.0`, HEAD `17c03ab`, `git status --porcelain` empty, `npm ls next` = 16.3.0, no listeners on 3310/3311.
- Docker restored: app-dev container restarted (was stopped to remove docker-owned `.next`), mongo healthy.
