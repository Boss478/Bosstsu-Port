# Post-mortem: Performance · Security · A11y v1.10.86 campaign (process retrospective)

Date: 2026-08-03 · Delivered: **v1.10.86** · Severity: low (no incident — process learnings from a successful campaign, with one major verification-tooling lesson) · Scope: 17 items across 4 workstreams (security 4 / a11y 8 / perf 3 / trivial 2) implemented via 8 parallel lanes + 1 fix pass, all senior-approved, shipped as v1.10.86

## Summary

The review campaign (`.agents/report/review-campaign-2026-08-03.md`) left 17 open findings: security (3 MAJOR + 1 MINOR DoS/OOM/misconfig vectors), accessibility (MAJORs + MINORs + 1 open ticket), performance (2 MINOR + checkpoint write-churn), plus two decided one-liners. **All 17 were implemented in a single day as v1.10.86** via **8 parallel lanes (4 + 3 + 1 juniors) + 1 fix pass**: S1 analytics per-field whitelist + caps · S2 AnalyticsEvent TTL index (90d) · S3 dictionary proxy timeout/size-cap/rate-limit · S4 ANALYTICS_SALT guard; A1 logo h1 keyboard-operable · A2 FillLevel cells → buttons · A3 Victory/AllCards dialog pattern · A4 CardReveal label identifies the card · A5 TypingLevel input name · A6 AnalysisScreen % tiles · A7 contrast batch · A8 mascot/emoji aria-hidden; P1 collection animation budget · P2 art chunk split · P3 checkpoint system removal; X1 star legend truth (90 → 100) · X2 slug-index verification. **Senior APPROVED every wave on the first review pass — zero rework.** All gates green: build clean, lint 0, tsc clean, 43 vitest suites (185 alphabet + models). Release gate also closed **ADR-012 → Accepted** and **X2 → CLOSED** (HMR artifact, no code change). One operational caveat surfaced post-implementation: **`ANALYTICS_SALT` is set nowhere** — S4's guard correctly 500s analytics until devops sets it (release item, see below).

## What worked

1. **8-lane file-disjoint parallelism (4 + 3 + 1 juniors).** Wave 1: 4 lanes in parallel (S-1 S1+S4 ∥ S-2 S2+S3 ∥ A-1 A1–A5 ∥ A-2 A6+A8); Wave 1.5: A7 (contrast — touches A-1 AND A-2 files, correctly serial after both); Wave 2: 3 lanes (W-1 A7+X1 ∥ W-2 P1+P3 ∥ W-3 P2); + 1 fix pass. File-disjoint lanes → no merge conflicts, no cross-lane review ping-pong. **~3 serial days compressed into ~1 day.**
2. **Senior plan-review pins made every junior spec-ready — zero rework.** Every item carried a senior-verified spec (exact file, exact line, exact class/guard/test); the plan itself absorbed a 14/17-corrections review pass BEFORE implementation (P2 consumer list, P3 checkpoint aliveness, X2 re-scope to no-code-change). Juniors implemented to pins, seniors verified — nothing bounced, every wave APPROVED on the first pass.
3. **Juniors' self-caught edit-drops — the gotcha's 6th and 7th confirmed occurrences.** Two more silent edit-tool drops (P3's 11 call-site deletion and one a11y edit) were caught by juniors re-reading their own files (grep after every edit) before the lanes closed — the known gotcha neutralized by discipline, not luck.
4. **Live server-side verification with real proof.** Dictionary rate limit: a burst returned **exactly 120× 200, then 10× 429** when the 120/min window tripped. S4: salt removed → **exactly 500** with the misconfiguration log. Numbers, not vibes.
5. **Container-restart + `.next` named-volume clear as a clean verification environment.** Restarting the dev container AND clearing the `.next` named volume produced a genuinely clean slate for re-verification (essential once the shared-write hazard in "What didn't" was understood).

## What didn't (THE headline lesson)

**A ~3-hour false-alarm hunt for a "stale bundle" that never existed.** During A4/A8 live verification, the playwright MCP a11y snapshot showed the card-identity label / `aria-hidden` changes as absent — the conclusion drawn was "the client is serving a stale bundle". It wasn't. **The playwright MCP snapshot served a stale CACHED accessibility tree** — it survived browser restarts because the cache lives in the MCP server process, not in the browser. **The DOM was correct the whole time**, proven via chrome-devtools `evaluate_script` reading the actual attributes.

Contributing false leads (in order of damage):

1. **The QA campaign's `includes("A ⭐")` check could never match the snapshot's string format** — false-negative-prone by construction; a stale tree plus an impossible string match read as "leak still present".
2. **A broken regex created a fake "menu clean / card screen leak" asymmetry** — the pattern matched one screen's tree representation but not the other's, making a non-existent leak look card-screen-specific.
3. **Running `npm run build` while the dev server was live — MY mistake.** Shared `.next` write hazard; very likely caused real dev-cache corruption and added wasted time on top of the false alarm.
4. **The docker `.next` named volume surviving restarts** — container restarts did NOT clear it, which kept the "stale bundle" theory alive (the cache looked persistent because it was).

Resolution path: stop trusting snapshot tooling for ARIA truth — **verify at the DOM level (`evaluate_script` reading attributes). The attribute IS the contract.**

## Operational finding

**`ANALYTICS_SALT` is set NOWHERE** — not in the dev container, not in any `.env` file. S4's route guard therefore correctly 500s the analytics route until the salt exists (no empty-salt hashing, per ADR-012 Decision 4). **Release item for devops (dev + `.env.production`)**; until set, analytics ingest is disabled by design — the guard working as intended.

## Gotchas (also captured in `.agents/memory.md`)

1. **Playwright MCP a11y snapshot = stale-tree risk.** The cached accessibility tree survives browser restarts (cache lives in the MCP server process). Verify ARIA via chrome-devtools `evaluate_script` — the attribute is the contract.
2. **`includes("A ⭐")`-style substring checks on stringified snapshots false-negative.** The snapshot's string format never contains that exact substring; `indexOf` on structural tokens is the reliable form.
3. **Never run `npm run build` while the dev server is live.** Shared `.next` write hazard — corrupts the dev cache, spurious errors, wasted time.
4. **Docker dev `.next` is a named volume** — survives container restarts. Clear via `find /next -mindepth 1 -delete` in a helper container, not by restarting the container.

## Why no incident / why zero rework

- **Senior pins front-loaded correctness.** All decisions (exact classes, inner-catch placement for the dictionary first-audio fetch, TTL merge rule, P3 keep-the-legacy-cleanup-line) were resolved on paper before code existed — implementation review found nothing new, so no wave bounced.
- **Juniors' verify-after-every-edit discipline** caught both edit-drops (6th/7th occurrences) before the lanes closed.
- **The false alarm was resolved at the contract level.** The DOM check (`evaluate_script`), not the snapshot, decided truth — no code was changed to chase the phantom, so the hunt introduced no regression.
- **Honest verification ledger.** The A2/A3/A4/A5 live paths blocked by locked levels / no cards were surfaced as an open manual-checklist item rather than silently claimed verified.

## Validation

- build: pass · lint: 0 · tsc: clean · vitest: **43 suites green (185 alphabet + models)**
- Live server-side: dictionary burst → **exactly 120× 200 then 10× 429** ✓ · S4 salt guard → **500 + clear log** ✓
- a11y: verified at the DOM level via `evaluate_script` (aria attributes) — snapshot-based a11y checks retired mid-campaign
- ADR-012 → **Accepted** ✓ · X2 → **CLOSED** (HMR artifact, no code change) ✓
- Open: manual a11y checklist (A2/A3/A4/A5) — blocked by locked levels / no cards

## Action items

1. **Set `ANALYTICS_SALT`** (dev container + `.env.production`) — devops; until set, analytics 500s by design (S4 guard).
2. **Manual a11y checklist for A2/A3/A4/A5** — FillLevel keyboard fill, Victory modal trap/Escape/focus-restore, CardReveal label, TypingLevel input name (live paths blocked by locked levels / no cards).
3. **ADR-012 → Accepted** — DONE (status updated at release gate).
4. **X2 ticket close** — DONE (slug index = HMR artifact, no code change; todo.md status CLOSED 2026-08-03 — re-open only if the warning survives a clean container restart, with mongosh `getIndexes()` evidence).
5. **Replace playwright-snapshot a11y checks with chrome-devtools DOM checks** in future campaigns — the attribute is the contract.
