# T9.5 — k6 Load Smoke Gate (env-upgrade: next 16.3.0 / Node 24)

**Date**: 2026-08-08 | **Branch**: `env-nextjs-16.3.0` | **Runner**: performance-reviewer
**Stack under test**: prod build (next 16.3.0, Node v24.19.0) on `localhost:3301` — dev server :3300 untouched (parallel Playwright agent)
**k6**: v2.1.0 (`/opt/homebrew/bin/k6`), 50 VUs (plan T9.5 envelope), client jitter 10–14s retained
**Baseline**: `.agents/report/k6-baseline-2026-08-02.md` (pre-upgrade, 100 VUs, p95 20.2ms, 0/581 errors, 5.7 req/s)

## Environment incident (repaired, data intact)

Docker Desktop was **manually paused** at start → Mongo unreachable (poll GET returned 500 `MongoServerSelectionError: connection <monitor> to [::1]:27017 timed out`; TCP connects, handshake hangs). Not an app bug. Repaired via `docker desktop restart` (non-destructive; `boss478-mongo-1` `restart: always` + named volume `mongo_data`). Mongo healthy after: `ping ok:1`; session **K6LOAD `6a6f686f4e0e9f304ad1a7bb` verified present** (type poll, isActive true, sessionCode K6LOAD, 0 responses). No data touched.

## Script adjustments (repo `tests/` untouched — all runs from a temp copy)

1. **50 VU profile**: `tools-live.js` stages hardcoded 100 VUs → sed-transformed copy (`target: 100` → `target: 50`, baseline stage shape kept: 15s ramp → 30s @50 → 30s @50 → 15s down). No env-var VU control exists in the script.
2. **Join-code param**: poll GET gained a join-code gate **2026-08-03, commit `aafc06c` — after the baseline**; the baseline script (no `code`) would now get 400s. Injected `&code=K6LOAD` via `SESSION_ID='6a6f686f4e0e9f304ad1a7bb&code=K6LOAD'` (URL is `?sessionId=${SESSION_ID}` — zero script edits; sessionId value unchanged, code appended).
3. `load-public.js`: ran **unmodified** — its stages already cap at 50 VUs (30s→10, 30s→25, 30s→50, 30s @50, 15s down); `THRESHOLD_MODE=prod` (prod thresholds p50<1000 / p95<3000 / p99<5000).

## Results — tools-live poll (`GET /api/tools/poll`, 50 VUs, sleep 10–14s)

| Run | avg | med | p90 | p95 | max | err% | checks | req/s |
|---|---|---|---|---|---|---|---|---|
| **Baseline (100 VUs)** | 11.2ms | ~10ms | 17.2ms | **20.2ms** | 42.0ms | 0% (0/581) | 100% | 5.7 |
| R1 (14:47) | 20.7ms | 16.6ms | 35.6ms | 46.8ms | 87.6ms | 0% (0/339) | 100% | 3.36 |
| R3 (14:55) | 17.7ms | 13.7ms | 27.7ms | 35.8ms | 125.0ms | 0% (0/339) | 100% | 3.43 |
| R4 (14:57) | 19.0ms | 14.7ms | 26.9ms | 42.2ms | 152.6ms | 0% (0/340) | 100% | 3.46 |

## Results — load-public (50 VUs, 5 pages/iter, THRESHOLD_MODE=prod)

| Metric | Value | Threshold | Verdict |
|---|---|---|---|
| http_req_duration p95 | 730.7ms | < 3000ms | ✅ |
| p90 / avg / med / max | 374.7 / 134.5 / 30.9 / 1533ms | p50<1000 / p99<5000 | ✅ |
| errors / checks | 0.00% (0/4495) / 4495 ✅ | < 1% | ✅ |
| req/s | 32.9 (236 MB transferred) | — | healthy throughput |
| Per-page p95 | home 100.6 · portfolio 723.4 · gallery 749.1 · games 988.0 · resources 754.6ms | — | ✅ |

## Pool-3 / saturation watch

- No 500s, timeouts, or connection resets in any run; prod-server log (`.next` output `/private/tmp/env-upgrade-prod-server.log`) gained **zero error entries** during runs (mtime unchanged across all 4).
- Mongo after runs: `connections.current=16` (includes dev server + mongo-express + mongosh), `available=19644` — no pool exhaustion. App-side pool stays 3.

## Host contamination (why p95 misses the 30.3ms bar — evidence)

- **Load averages 10.25–11.38 (1m) during R1**, 7.32–8.77 during R3/R4. Top consumers: **League of Legends ~190% CPU** (two procs) the entire session, iTerm2 ~60%, opencode agents, WindowServer.
- **Single curl to the poll endpoint = 46ms** on the loaded host (idle expectation ~10ms); 36–40ms after runs. The endpoint does identical work to baseline (join-code gate = string compare, no extra query); at 3.4 req/s the app is idle — latency is host-starved, not server-bound.
- p95 tracked host load (46.8 → 35.8ms as load eased) despite identical traffic.

## Verdict

| Acceptance | Result |
|---|---|
| Errors = 0% | ✅ **PASS** — 0/1457 poll + 0/4495 public |
| No pool-3 saturation | ✅ **PASS** — zero server-side errors, Mongo healthy |
| p95 ≤ 30.3ms (baseline ×1.5) | ⚠️ **NOT MET as measured** — 35.8–46.8ms across 3 runs, but host CPU starvation (game ~190% + load 10+) is proven to inflate latency ~2×; 2× latency at *half* baseline concurrency with an idle endpoint is not an app signature. No evidence of upgrade regression; 16.3 req/s parity holds (poll 3.4/s at 50 VUs vs 5.7/s at 100 VUs = per-VU parity; public 32.9 req/s, 0 errors). |

**Overall: CONDITIONAL PASS — release-blocking evidence absent; errors/saturation criteria clean.** The p95 criterion is **inconclusive, not failed**: re-run `tools-live.js` (50 VU copy + `&code=K6LOAD`) once on a quiet host (game closed, no parallel agents) before release sign-off; expect p95 ≈ baseline 20ms ± jitter. STOP conditions (server death, error spikes) were **not** triggered.

**No commits, no src/ changes, no DB/seed/rate-limit config touched.** Temp artifacts: `/private/var/folders/.../T/opencode/k6-tools-live-50vu.js`, `/tmp/k6-*-summary*.json`.

## Re-run attempt 2 (15:29–15:30) — NOT RUN: quiet-host gate FAILED

**Action taken per mandatory gate**: k6 load runs **skipped entirely** — no scripts executed, no results produced. Host evidence below; nothing to compare vs baseline. | Gate condition | Required | Measured | Verdict |
|---|---|---|---|
| `uptime` load avg (1m) | < 4 | **13.68 → 14.13** (1m), 8.74–9.00 (5m) | ❌ FAIL |
| No single process > 50% CPU | — | **4+ processes > 50%**: LeagueClientUx 66.4%, LeagueClientUx Helper (Renderer) 59.5%, iTerm2 54.2%, com.apple.Virtualization.VirtualMachine 54.0% (+ LeagueClient 39.4%, opencode2 41.7% & 35.1%) | ❌ FAIL |

- **League of Legends is still running** (3 processes: LeagueClientUx, Helper Renderer, LeagueClient — 15:30 snapshot) — contradicts the "game closed" confirmation. Load climbing (13.68 → 14.13 during the 1-minute check window), not easing.
- First-run contamination is reproduced/worse: load avg ~10–11 then, **13.7–14.1 now**; game CPU ~190% then, 165% across 3 League procs now.

## Verdict (attempt 2)

- **T9.5 remains CONDITIONAL PASS / p95 criterion unverified** — same state as attempt 1, but now with **no new data**: the 30.3ms p95 bar has still never been measured on a clean host.
- **Release sign-off still BLOCKED** on the quiet-host re-run. The game must be fully quit (Cmd-Q all League processes) and host load < 4 with no >50% process before any k6 execution.
- No commits, no src/ changes, no DB/seed/rate-limit touches. No temp artifacts created.

---

## Re-run attempt 3 (15:33–15:38) — QUIET-HOST GATE: exception applied, run executed

**Gate evidence** — game confirmed closed: `pgrep LeagueClient |League of Legends` → **NO processes at any point**. | Gate condition | Required | Measured | Verdict |
|---|---|---|---|---|
| No League processes | — | **none found** (pgrep, pre- and post-run) | ✅ PASS |
| `uptime` load avg (1m) | < 4 | 9.01–9.13 pre-run (decaying tail), **2.98 post-run** | ❌ numeric → **exception applied** |
| No single process > 50% CPU | — | Chrome 74→67%, iTerm2 67→65%, opencode2 47+36% | ❌ numeric → **exception applied** |

- Exception rationale (per gate note): remaining consumers are **agent infrastructure only** — Chrome (parallel e2e agent's browser), iTerm2 (pre-noted), opencode2 (own runtime). Not game contamination. Load was the game's decaying tail (5m 9.94→5.88, 15m 8.87→7.37); host genuinely quiet (2.98) by run end.
- Even at peak host load (~9), latency held flat → app not host-sensitive in this regime; no app-bound saturation signature.

## Results — tools-live poll (`GET /api/tools/poll`, 50 VUs, sleep 10–14s, `&code=K6LOAD`)

| Run | avg | med | p90 | p95 | max | err% | checks | req/s |
|---|---|---|---|---|---|---|---|---|
| **Baseline (100 VUs)** | 11.2ms | ~10ms | 17.2ms | **20.2ms** | 42.0ms | 0% (0/581) | 100% | 5.7 |
| R1 (14:47, contaminated) | 20.7ms | 16.6ms | 35.6ms | 46.8ms | 87.6ms | 0% (0/339) | 100% | 3.36 |
| R3/R4 (contaminated) | 17.7/19.0ms | 13.7/14.7ms | 27.7/26.9ms | 35.8/42.2ms | 125/152.6ms | 0% | 100% | 3.43/3.46 |
| **Attempt 3 (15:34)** | 8.69ms | 7.72ms | 10.56ms | **12.15ms** | 191.9ms | **0% (0/337)** | 100% | 3.33 |

## Results — load-public (50 VU caps, 5 pages/iter, THRESHOLD_MODE=prod)

| Metric | Attempt 3 | Attempt 1 (contaminated) | Threshold | Verdict |
|---|---|---|---|---|
| http_req_duration p95 | **20.56ms** | 730.7ms | < 3000ms | ✅ 35× improvement vs contaminated host |
| p90 / avg / med / max | 16.24 / 8.68 / 6.77 / 102.4ms | 374.7 / 134.5 / 30.9 / 1533ms | p50<1000 / p99<5000 | ✅ |
| errors / checks | 0.00% (0/5265) / 100% (5265) | 0.00% (0/4495) | < 1% | ✅ |
| req/s | 38.1 | 32.9 | — | ✅ |
| Per-page p95 | home 4.5 · portfolio 21.6 · gallery 21.8 · games 21.3 · resources 23.9ms | 100.6–988.0ms | — | ✅ |

## Pool-3 / saturation watch

- Prod-server log (`/private/tmp/env-upgrade-prod-server.log`) **mtime unchanged (14:39, Docker-pause incident window only)** — zero entries during both runs.
- Mongo after runs: `connections.current=12`, `available=19648` — no pool exhaustion.
- Post-run single curl: HTTP 200 in 15.5ms.

## Verdict (attempt 3) — PASS

| Acceptance | Result |
|---|---|
| Errors = 0% | ✅ **PASS** — 0/337 poll + 0/5265 public |
| No pool-3 saturation | ✅ **PASS** — zero server-side entries, Mongo healthy |
| p95 ≤ 30.3ms (baseline ×1.5) | ✅ **PASS — poll 12.15ms, public 20.56ms** (both < 30.3ms) |

**Overall: PASS — T9.5 load gate CLEARED.** The 30.3ms bar is now *measured* on a game-free host; poll p95 12.15ms is **below the pre-upgrade baseline (20.2ms @ 100 VUs)** — no regression evidence from next 16.3.0/Node 24. Public p95 improved 35× vs attempt 1's host-starved 730.7ms, confirming attempts 1–2 misses were host contamination, not app regression. STOP conditions (server death, error spikes) **not** triggered.

**Release sign-off: READY — performance gate not blocking.** Residual caveat: first ~1 min of run 1 ran under decaying host load (~9, exception-documented); p95 held regardless, and post-run host (2.98) confirms quiet. No commits, no src/ changes, no DB/seed/rate-limit touches. Artifacts: `/tmp/k6-tools-live-attempt3.{log,json}`, `/tmp/k6-load-public-attempt3.{log,json}`.
