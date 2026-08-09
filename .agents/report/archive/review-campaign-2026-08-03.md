# Review Campaign Report — Alphabet Adventure + Site (2026-08-03)

Scope: post-completion review of the Alphabet Adventure game + site-wide checks. Sources: senior-engineer (code: QA/perf/security/a11y), database-reviewer (DB layer), observer (live info), manager browser smoke test (playwright). Build state: `npm run build` PASSES; tsc/lint clean (user's tools WIP type error no longer present).

---

## 0. Task delivered during review: SHOW ALL CARDS → BETA only

**Change applied (uncommitted, awaiting your review):** `AlphabetAdventureClient.tsx:429` — `onShowAllCards` gated with `beta` (mirrors the existing `:543` pattern).
**Verified in-browser:** release menu → button GONE ✓ · beta menu → button PRESENT ✓. ESLint + tsc clean. Senior-engineer reviewed (one-liner, no dead code — `showAllCards` state/modal still used by beta).

---

## 1. QA / Does the game run well? — RUNS WELL, 6 confirmed issues

**Smoke test (manager, playwright/keyboard, release + beta):**
- ✅ Menu → Level Map → Stage → Lesson → round flow all keyboard-operable; tab order perfect (skip-link → 🔤 → 🏆 → ✨BETA → 🏠 → CTA → switch → My Cards → Analysis → Start Over)
- ✅ 0 console errors / 0 page errors on both routes (only 6–18 font-preload warnings — perf nit)
- ✅ Correct answers score (+5, ✓, progress advances); wrong answers penalize (−3, ✗)
- ✅ Progressive unlock (locked stages/lessons `disabled` with 🔒); TH/EN bilingual copy; skip-link; h1/h2/h3 structure; live region for feedback; accessible button names incl. Thai
- ⚠️ 6 font preload warnings per page load (unused woff2 preloads — NIT)

**Confirmed bugs (reproduced in-browser):**
| Sev | Finding | Evidence |
|---|---|---|
| MAJOR | **Keypad bypass**: pressing a wrong choice's number repeatedly deducts −3 each time (score 2→0 on same round, ✗ feedback re-fires, progress unchanged) | GameScreen.tsx:88-91 lacks the `wrongChoices` guard the click path has |
| MAJOR | **Overlay focus race**: 8s auto-dismiss + auto-focus on answer button 1 → a stray Enter/Space after the overlay auto-dismisses answers wrong (−3) silently | Reproduced: fresh lesson, one Enter = wrong answer recorded on round 1 |
| MINOR | **Escape = instant exit, no confirm**; checkpoint writes happen per-answer but resume (`loadCheckpoint`) is never called → accidental Escape loses the lesson with nothing to resume | Reproduced: Escape → straight to stage screen |
| MINOR | **Debug panel exposed in release**: 👁️ "Toggle debug panel" (GameOverlays.tsx:85-93) shows the full drop-rate table (0.01% legendary etc.) to players | Reproduced — YOUR call: gate behind `beta`/dev, or intended? |
| MINOR | Hero card SVG: role-less `<svg>` exposing "A ⭐" text to SR without a label; all 96 art SVGs unlabeled (decorative → `aria-hidden`, or labelled) | Browser a11y tree |

**Senior-engineer code findings (QA):** 5 MAJOR — ① stale transition `setTimeout`s never cleared (Back mid-transition → old round corrupts the next lesson; disable Back while `isTransitioning`, clear timers on unmount) · ② typing errors never tracked (`roundData.grid.filter` runs pre-update → always `[]`; must use `newGrid`) · ③ 3 achievements can never unlock (`perfect_3x`, `perfect_stage`, `revisit` — callers never supply ctx) · ④ VictoryScreen star legend contradicts `calcStars` (legend: ⭐⭐ ≥90%; code: 3 stars ≥90%) · ⑤ (same as keypad bypass above). 7 MINOR — double card reveal on final answer, dead checkpoint writes, corrupt-map-save crash (validate shape), `hasSavedProgress` stale after first lesson, dead difficulty system, `isThaiText` dead branch, per-answer achievement-check churn.

## 2. Performance — GOOD, 3 MINORs

- **Big-O all trivial**: Fisher–Yates O(n) unbiased shuffle; round generators O(choices); drop rolls O(95); achievement check O(100); CardScreen O(n²)≈9k — nothing to worry about
- **Bundle**: game chunk 97KB gzip incl. all 96 SVGs — reasonable; art could be dynamic-imported behind card views (MINOR)
- **Server**: game uses **zero DB at runtime** (all localStorage) — pool-3 untouched; analytics batched (queue 50/30s, insertMany, 600/min/IP) ✓ fits 50–100 concurrency
- MINORs: ① checkpoint `setItem` + 3–5 JSON.parse per correct answer (dead feature — drop it) · ② 55+ infinite holo-shimmer + 95 staggered flips in collection view (jank on low-end) · ③ art chunk split opportunity
- ⚠️ 4.1MB dev-mode chunk (prod 97KB gzip — fine)

## 3. Security — GAME CLEAN, 3 site MAJORs

- ✅ Game: no secrets in client; all dynamic text React-escaped (no XSS); same-origin only; localStorage cheating = accepted risk (document it — no leaderboards on it); auth rate-limit untouched by game path
- MAJOR `api/analytics/route.ts:52-60` — unauthenticated; `sessionId`/`eventName` unbounded → multi-MB strings → storage DoS on 4GB VPS. Cap ≤64 chars + validate enums.
- MAJOR `models/AnalyticsEvent.ts:34-36` — no TTL index → collection grows forever. Add `expiresAfterSeconds: 90d` TTL.
- MAJOR `api/dictionary/route.ts:56-64,89-98` — audio proxy: no size cap/timeout/rate limit; full base64 in memory → OOM risk on 1 vCPU. `AbortSignal.timeout(10s)` + 2MB cap + rate limit.
- MINORs: `ANALYTICS_SALT || ''` — make salt required; (DB reviewer adds: `/api/tools/focus` unauthenticated+unrate-limited, upvotes `$inc` no dedup — both in your tools WIP area, verify post-refactor)

## 4. Accessibility — REJECT (8 MAJORs, mostly fixable by copying existing patterns)

- MAJOR: logo `<h1 onClick>` not keyboard-operable (2.1.1) — wrap in `<button>`
- MAJOR: FillLevel grid cells = clickable `<div>`s, no role/keyboard — use `<button>`
- MAJOR: Victory details modal + AllCardsModal: no `role="dialog"`/trap/focus restore (CardRevealModal already has the correct pattern — copy it)
- MAJOR: OnboardingOverlay: no dialog role/trap; 8s auto-dismiss (confirmed harmful in smoke test)
- MAJOR: CardRevealModal `aria-label="Card revealed"` hides WHICH card — include letter/word/tier
- MAJOR: Typing/Fill inputs have no accessible names (placeholder ≠ name)
- MAJOR: **no `prefers-reduced-motion` handling** anywhere in the game (infinite bounce/pulse/shimmer/flip/confetti — kids with vestibular sensitivity)
- MINORs: hover-only % tiles (AnalysisScreen), Escape no-confirm, focus-after-wrong lands on disabled button, contrast (violet-500 badge 3.6:1, amber-500 streak 2.4:1, zinc-400 labels 2.4:1), unlabeled back button default, CardScreen no Escape handler

## 5. DB layer — HEALTHY, 0 blockers · 7 MAJORs (site-wide)

Pool 3 + `bufferCommands:false` correctly tuned ✓ · 17 strict schemas ✓ · game = zero DB ✓ · auth env-based, no password storage ✓ · .env gitignored ✓. MAJORs: ① no TTL index anywhere (AnalyticsEvent unbounded) ② admin analytics page = 12 heavy ops incl. unindexed countDocuments on every load ③ poll GET `$facet` rescans all session responses every 10s (live-classroom hotspot) ④ student submit 5–6 sequential ops with TOCTOU races ⑤ `/api/tools/focus` unauthenticated ⑥ upvotes `$inc` no dedup ⑦ admin session list regex COLLSCAN + no backups exist. **Top 5 quick wins**: TTL+compound index on analytics · cache poll `$facet` counts · merge submit ops · rate-limit focus route · `{createdAt:-1}` index + nightly mongodump. (Items ③④⑤⑥ are in your tools WIP — re-verify after refactor.)

## 6. Live monitoring (observer) — PRODUCTION UNVERIFIABLE ⚠️

- **VPS 187.77.146.149 unreachable from observer's network** (SSH/HTTP/DNS all timeout) — could be network-path or real outage. **Action: verify VPS power state + DNS from another network** (devops/manual). Ticket: MAJOR.
- Local docker stack: home 200 (423ms), game page 200 (65–549ms warm), 404s correct, mongo healthy (0 slow ops, 1.1MB dev DB), game menu renders clean — the game itself is sound.
- Minor: duplicate `{"slug":1}` index warning (Mongoose) — ticket MINOR.

## 7. Suggested next decisions (your call)

1. **Fix batch 1 (game, high-value, small)**: keypad bypass guard · transition timer cleanup · typing `newGrid` tracking · star legend · Escape confirm · overlay dialog/trap + reduced-motion global CSS — ~1 session
2. **Debug panel**: gate behind beta/dev, or intentional? (one line either way)
3. **Achievements wiring** (3 un-unlockable) + checkpoint (drop writes or wire resume)
4. **Site security batch**: analytics caps + TTL index + dictionary proxy caps (small)
5. **VPS reachability check** — do it first, everything else can wait
6. Commit the SHOW ALL CARDS one-liner (currently uncommitted, awaiting your review)
