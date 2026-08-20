# ADR-023 — Session Tokens Stay HMAC + Agent Token Budget Policy

**Date:** 2026-08-09 · **Status:** Accepted · **Owner:** manager

## Context
Two questions converged: (1) could the app's session tokens be "optimized" (e.g., moved to JWT)? (2) agent sessions burn unbounded LLM tokens (memory.md 44KB, 203 report files, whole-plan subagent prompts).

## Decision
1. **Session tokens remain HMAC-SHA256 `timestamp.hash` (WebCrypto), stateless, ~70 chars.** No JWT migration — JWT adds base64 bloat + a dependency with zero benefit at the 1-vCPU / 50–100-user envelope (auth middleware = 1 HMAC op, no DB round-trip). Cookie flags stay `httpOnly` + `secure` + `sameSite: strict`; login rate limit 5/15min stays.
2. **Agent token budget policy** (see `.agents/plans/token-usage-optimization.md`, tasks T1–T4b):
   - Prompt-efficiency checklist in AGENTS.md (targeted reads, intake contracts, artifact reuse, brief caps)
   - `memory.md` entries auto-archive after 6 months (`.agents/memory/archive/archive-YYYY.md`), owner reporter-doc
   - Subagent intake contracts ≤ 60 lines; reviewer outputs ≤ 40 lines
   - Report retention: keep 12 + latest release eval; rest → `.agents/report/archive/`
   - Archive dirs git-tracked via `.gitignore` negations (`.agents/` is otherwise ignored)
   - **Model routing REJECTED 2026-08-09** (user runs a single model) — do not re-propose task routing as a token lever
3. **Non-negotiable:** senior-engineer review + verify gates are NOT token-saving targets. Never skip a quality gate to save tokens.

## Alternatives rejected
- **JWT sessions** — more bytes, more deps, no benefit at this scale (rejected above)
- **Deleting old memory/reports** — history has caught real regressions; archive-only
- **Trimming AGENTS.md** — single source of truth; trimming costs more in re-derivation

## Consequences
- App auth unchanged in shape; only `step/route.ts` drops its query-param fallback (header-only, SSE route excluded — EventSource can't send headers)
- Session context per agent session shrinks over time (~30–50% memory brief within 3 months)

## Amendment — Wave 3 (2026-08-20, Full B1–B5, ~3h, manager)
- **Status stays Accepted** (no reversal)
- Wave 3 enforces Wave 2 deferred retention (B3 101→13 md, 79→1 eval, 14 non-md → archive, parity 370==370, archive 357, move-then-index; reporter 600 target /800 max tables exempt + Opencode cache-hit line mandatory-with-`n/a` B2)
- Adds enforcement script `scripts/check-token-hygiene.mjs` ≤80 lines zero deps `npm run check:tokens` **warn-only 2w then ask before hard block** (B1 45 lines, checks memory≤250 report 13 split non-md0 task≤60 verdict≤40 exclude todo.md ≥5 else n/a, archives git-tracked)
- Adds AGENTS.md checklist 8→9 context-engineering row (B4) + orchestration Fast Path ask-when-ambiguous + Report Phase fast-path rigor (B5)
- DAG B3→B2→(B1∥B4∥B5)→B6, P0 B3/B1 P1 B2/B4 P2 B5/B6, all doc/housekeeping zero DB/CPU (pool 3, 50–100 concurrency untouched); S1 hard (13 md, ≤250, ≤150 brief, 0 non-md besides archive), S2 soft 85% cache-hit mandatory-with-`n/a` Opencode logs, S5 no regressions (build/lint/typecheck + eval 17/17), S6 advisory Opencode 10-session window
