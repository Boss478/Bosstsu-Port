# Post-mortem: Alphabet Adventure card-art polish session (process retrospective)

Date: 2026-08-02 · Delivered: `2c2b8f2` (v1.10.84) · Severity: low (no incident — process learnings) · Scope: 14 art pieces user-approved, 4 reference redraws, 1 revert, 1 blocked-commit caught early

## Summary

A one-by-one user-approval art polish campaign (target: every card ≥8/10) delivered 14 approved pieces in one session. Three iterations were rejected-and-redone (Axe ×4, Watermelon ×2, Whale/Dolphin/Van ×2 each) before the user supplied **reference SVGs** — after which acceptance was instant. One redraw (Leg) was reverted by user taste. A concurrent-work build block (user's in-progress tools refactor breaking `renderTool` arity) was caught BEFORE committing — the v1.10.82 wipe lesson applied successfully via selective staging.

## What worked

1. **User references beat senior-engineer specs for art direction.** Axe: 3 code-iteration attempts from the senior spec (wedge → crescent → crescent+beard) all rejected; the user's SVG reference accepted on first translation. Whale/Dolphin/Van: same pattern — reference-first, accepted. Lesson: for TASTE-driven work, ask for the user's reference/direction BEFORE iterating on spec-based guesses.
2. **ASCII rasterization verification** (`/tmp/raster.mjs`, point-in-polygon over the flattened path) caught the "triangle masquerading as axe blade" problem that eyeballing coordinates missed. Cheap, effective geometry QA for SVG hand-editing.
3. **Selective staging commit protocol** (from the v1.10.82 post-mortem) validated: `2c2b8f2` contains exactly the 7 intended files (4 art + package.json + package-lock + changelog); the user's 18-file tools WIP remained untouched and uncommitted. Full-gate build was deferred with the blocker explicitly surfaced rather than sweeping WIP into a commit.
4. **One-by-one approval cadence** kept the user in control — every piece was confirmed/adjusted individually, and the user's "as-is OK" (Bear) and "skip" (Horse) calls were respected without argument.

## What didn't

1. **Speculative redraws waste cycles.** Leg: full redraw (tapered silhouette + knee cap + sock + sneaker, per senior spec) was reverted in one click — user prefers the original. Cost: ~4 tool calls + a revert. The senior spec's "cartoon leg" direction did not match user taste. Should have asked "keep or redraw?" with a reference suggestion first.
2. **Quadratic-curve intuition is unreliable for crescent shapes.** Three attempts at an axe cutting edge produced wedges because the Q-control bulge was mathematically small relative to the chord. The rasterizer exposed it — but only after 2 rejected iterations.
3. **Gradient style is now a 4-card minority** (Axe, Whale, Dolphin, Van) against 91 flat cards. Intentional per user direction (reference-driven), but flagged: the visual-language split is a debt item — either migrate more cards to gradients (user provides references) or accept the mixed style as a "premium tier" feature.

## Why no incident

- The v1.10.82 wipe post-mortem produced the "check for concurrent WIP before committing" reflex: `git status` was run before the gate, 16 foreign modified files were spotted, the build failure was traced to the user's file (not the art), and the user was asked how to proceed (selective commit chosen).

## Validation

- `2c2b8f2`: 7 files, +827/−123. Senior-engineer verified SVG geometry (23 unique gradient IDs, no cross-file collisions, z-order, viewBox bounds, transform math), eslint 0 problems, tsc clean. Art files individually green; full build deferred to the tools WIP landing.

## Action items

- **Ask for direction first on taste-heavy redraws** (leg, kid, iron, unicycle, nose-class items): "keep, outline-pass, or reference?" — avoids revert churn.
- **Track the gradient/flat style split** as a debt item in `.agents/tasks/todo.md` — decide premium-tier migration vs. rollback.
- **Keep the rasterizer** (`/tmp/raster.mjs` pattern) as the geometry QA tool for future SVG edits.
- Remaining queue: ~40 pieces <8 (tracked in `.agents/tasks/card-art-polish.md`).
