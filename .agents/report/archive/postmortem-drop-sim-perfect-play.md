# Post-mortem: Drop-economy simulator over-yielded 97–98% (perfect-play assumption)

Date: 2026-08-01 · Fix commit: `eda2b7d` · Sim: `/tmp/dropsim3.js` (broken), `/tmp/dropsim4.js` (fixed) · Owner: build agent

## Summary

While adding a streak-gated rare+ ramp to Alphabet Adventure's per-correct card roll, the balance simulator predicted 97–98% end-of-run collection for every ramp variant — obviously wrong against the 65% baseline and the 60–70% design target. Root cause: the simulator modeled a **perfect playthrough with zero wrong answers**, but in the real game wrong answers reset the drop streak (`useGameActions.ts:532`), and the ramp was gated on that streak. Fix: model per-answer wrong probabilities per stage type (with the match-stage `WRONG_LIMIT=2` cap), which restored sane predictions (65–72% across variants) and let the final config (B/Q3) land inside all three skill bands.

## Symptom

`dropsim3.js` output for four ramp variants (V1–V4), 20k runs each: end-of-run collection **97–98%** with 12–31 dupes/run — versus the 65% baseline the same simulator produced without the ramp. The ramp was supposedly capped at 2.5% combined; a 2.5% per-answer event cannot produce 56 rare+/run over 748 answers.

## Root cause

`dropsim3.js`'s per-round loop only iterated the `targetMin` correct answers per round and never emitted wrong answers:

```js
for (let i = 0; i < rounds; i++) {
  streak++;
  ...roll...
}
```

But the real game resets the chain in three places the sim ignored:

1. **Wrong answer → `dropStreakRef.current = 0`** (`useGameActions.ts:532` for match/fill, `:696` for typing)
2. **Card drop → `dropStreak = max(0, streak − 5)`** (`applyCardDrop`, `useGameActions.ts:327`) — this one the sim *did* model
3. **Sub-stage start → `dropStreakRef.current = 0`** (`startSubStage`, `useGameActions.ts:272`) — not modeled

With no wrongs, chains only ever broke on card drops (each costing −5), so a perfect player's streak ratcheted back up to 10–20 within a handful of answers and stayed there — every answer rolled the ramp at/near its cap. The ramp's real-world yield (~2 rare+/run for a typical kid) was inflated ~30×.

## Why it produced the symptom

The ramp was gated: `rate = 0 below threshold, linear to cap by chain 20`. The symptom (97–98%) only appears when the chain distribution is wrong. Perfect play ⇒ 50%+ of answers at chain ≥8 ⇒ ramp fires on a huge fraction of answers. Because the earlier A1c-2 calibration (65% baseline) was *also* run on perfect play but landed acceptably, the modeling flaw was invisible until the ramp made chain distribution the dominant sensitivity.

## Fix

1. **Simulator** (`dropsim4.js`): added per-answer wrong probabilities per stage type — three kid profiles (easy 2/5/10%, typical 5/10/20%, struggling 10/20/35% wrong for match/fill/typing), the match `WRONG_LIMIT=2` auto-advance, and the sub-stage start chain reset. Verified against source (`useGameActions.ts` lines 250–329, 416–610, 612–769; `cards.ts` `rollCardDrop`/`getEffectiveStreak`/`resolveDropTier`).
2. **Balance** (commit `eda2b7d`): with realistic chains, selected config B/Q3 — `RAMP_DROP` (floor 0.05%, quadratic to 2.0% by chain 20, split Rare 60/Ultra 30/Legendary 10) checked on the raw chain before the common/uncommon table in `rollCardDrop` (`cards.ts`), win table trimmed to None 15/Rare 43/Ultra 30/Legendary 12 (`constants.ts`), live ramp rates in the debug HUD (`GameOverlays.tsx`).

The fix addresses the root cause (wrong chain distribution), not the symptom: the same sim infrastructure now correctly throttles the ramp via wrong-answer resets.

## How it was found

- First run of the ramp variant (V1 thresh 8, cap 2.5) exploded to 97–98% with 56 rare+/run from correct answers — a 2.5%-cap event cannot fire 56×/748 answers (expected ~3). Hypothesis 1: cap arithmetic bug — **rejected** by hand-computing the ramp formula. Hypothesis 2: cascade amplification — partially true but insufficient; cascade needs full tiers, and `dropsim2.js` (A1c-2, cascade, no ramp) correctly produced 65%. Hypothesis 3: **chain distribution** — confirmed: with no wrong answers, `streak ≥ 8` was 52%+ of answers (easy profile), vs ~38% with realistic wrongs.
- The confirming experiment: adding a wrong-answer model dropped every variant back into 65–72%, and the baseline stayed at ~64% across all three profiles — matching the pre-ramp economy.

## Why it slipped through

Workload gap: the simulator had never needed to model wrong answers because the pre-ramp economy (common/uncommon, streak-interpolated on `min(10, chain + dropPower)`) was insensitive to chain length — its rates saturate at effective streak 10, so perfect-vs-typical play differed by <1%. The ramp's raw-chain gate made chain distribution the dominant sensitivity, and the perfect-play sim carried over silently from `dropsim.js`/`dropsim2.js` (which had also under-modeled the sub-stage reset). No test enforced that the sim mirrored the source's chain resets.

## Validation

- `dropsim4.js`, 20k runs × 3 kid profiles, final config: end-of-run collection **67.6% (smart) / 66.3% (typical) / 64.9% (struggling)** — inside the 65–70 / 63–67 / 60–65 bands. Zero dupes before full set in every variant.
- Implementation parity: `rollCardDrop` ramp-first on raw streak + table on `min(10, streak+dropPower)` matches sim mechanics; `rampRate` math verified at chains 0/10/20 (0.05 / 0.537 / 2.0%).
- `tsc --noEmit`, `eslint`, `npm run build` all clean for the module (pre-existing repo-wide lint noise in `tests/`, `tools/`, `beta/CardScreen.tsx` excluded — not touched).
- Not validated: live browser playtest of the new drop flow (see action items).

## Action items

- **Persist the simulator**: `/tmp/dropsim4.js` is throwaway; copy to `.agents/sims/dropsim.js` so future balance changes (and the pending rare+ = full-reset option) reuse the calibrated mechanics. (Owner: build agent.)
- **Regression eval**: `.agents/evals/` is empty — add a frozen-rate eval asserting `CARD_DROP_RATES`, `WIN_DROP_RATES`, and `RAMP_DROP` exact values, so a future rebalance can't silently drift the economy. (Owner: build agent.)
- **Manual playtest**: verify save/load, checkpoint resume, win-roll reveal, collection, and Start Over with the new rates in a real browser session. (Owner: user.)
- **Simulator lint gap**: the sim caught a class of modeling error; consider a code-comment contract on `rollCardDrop`/chain resets pointing at the sim for future edits. (Owner: build agent, low priority.)
