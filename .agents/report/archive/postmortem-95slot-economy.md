# Post-mortem: Drop economy calibrated on a collection that never existed (130-slot → 95-slot, B2a fix)

Date: 2026-08-02 · Fix: `f731cac` (v1.10.78) · Owner: build agent · Sim: `.agents/sims/dropsim95.js`

## Summary

The card drop economy shipped in v1.10.75 was calibrated and "validated" against a **130-slot collection model that never existed in the game** — the sim assumed every tier contained all 26 letters (5×26 = 130); the real `TIER_LETTERS` was 26 slots (then 95 from v1.10.77). On the real sets the rates were far too generous: **100% end-of-run collection on 26 slots** (dropsim26, full set by sub-stage ~7/30) and **88.5–91.7% on the 95-slot set** (dropsim95) — the chase economy (dropPower, rare+ ramp, no-dupe collection) was a foregone conclusion. Fixed in `f731cac` with the **B2a table set** (`constants.ts`), sim-validated at 20k runs × 3 profiles to land 65–75% end-of-run.

## Symptom

- v1.10.75 shipped with validation claims of **67.6 / 66.3 / 64.9%** end-of-run ("60–70% band") — computed on the phantom 130-slot model
- dropsim26 re-sim on the real 26-slot set: **100.0% end-of-run for all three profiles**, full deck by sub-stage ~6–7/30, 51–62 dupes/run
- dropsim95 re-sim on the shipped 95-slot set: **88.5 / 90.1 / 91.7%** (struggling/typical/easy), common/uncommon/rare tiers fully owned in 93–99% of runs, 43+ rare+ events/run
- `tests/unit/alphabet-adventure.test.ts`: **17 tests failing** — asserting the pre-v1.10.75 economy (6-entry per-correct table, base/max summing to 100, "Cake"/"Hippo" words, ETAOIS letter pools)

## Root cause

Two stacked causes:

1. **Calibration target ≠ shipped collection.** The v1.10.75 balance work (`eda2b7d`, post-mortem: `postmortem-drop-sim-perfect-play.md`) tuned rates against a 130-slot model "the entire prior design assumed" (dropsim26 report §4) — but `cards.ts` `TIER_LETTERS` at that time was **26 slots** (common 6 / uncommon 6 / rare 5 / ultra-rare 5 / legendary 4), one letter per tier. The validation sim (`/tmp/dropsim4.js`) encoded the 130-slot assumption directly, so its "in-band" verdicts were computed on a collection the game never had. With no-dupe `pickLetter` (`cards.ts:322`) + cascade `resolveDropTier` (`cards.ts:304`), ~87 card events per playthrough vs 26 slots ⇒ every run completes the deck; vs 95 slots ⇒ ~90%.
2. **Rate tests drifted red unnoticed.** The v1.10.75 restructure moved rare+ out of the per-correct table into `RAMP_DROP` and changed table entries, but `tests/unit/alphabet-adventure.test.ts` kept pre-restructure assertions. Vitest is not part of the build/lint gate, so 17 tests stayed broken across v1.10.75 and v1.10.77 with no signal.

## Why it produced the symptom

The sim said "in band" because the sim's collection had 130 slots; the game had 26. Sim and game agreed the economy was fine — they disagreed only about how many cards existed. With 26 slots and ~87 events/run, a player completed the deck by sub-stage 7 and pulled 50+ dupes; the "chase" was a participation trophy. Cascade amplified it: a full tier's drops convert upward, so no event is ever wasted until the whole set is owned.

## Fix

`f731cac` (v1.10.78):

- `CARD_DROP_RATES` (per-correct): null 93→82 ⇒ **95→88** · common 3→6 ⇒ **2.2→4.4** · uncommon 2→4.5 ⇒ **1.4→3.2**
- `WIN_DROP_RATES` (sub-stage clear): none 15⇒**32** · rare 43⇒**36** · ultra 30⇒**22** · legendary 12⇒**10** (win-drop chance 85%→68%)
- `RAMP_DROP` unchanged; ladder retuned `card_75`→`card_65`; 17 stale tests rewritten with **exact B2a values pinned** (frozen-rate contract — closes the postmortem-drop-sim-perfect-play action item)
- Why this fixes the root cause rather than the symptom: dropsim95 models the **real** `TIER_LETTERS` (95 slots, read from `cards.ts`), so tuning and shipped collection are the same object; B2a was the only scanned config of 7 (R1/R2/R3/B1/B2/B2a/B2b) landing all three profiles inside the 65–75% band.

## How it was found

1. dropsim26 (2026-08-01): re-sim against the real 26-slot `TIER_LETTERS` → 100% end-of-run → report recommended "Option C" (make the collection actually 130). User instead chose the 95-slot per-tier set (130-cards plan rev 3) — the economy was never re-tuned for it.
2. dropsim95 (2026-08-02): re-sim against the shipped 95-slot set with a **fidelity fix** — `applyCardDrop` (chain−5, dropPower+1) now applies on *every* drop, per-correct and win (`useGameActions.ts:317,319`); dropsim26 had applied it on win drops only.
3. **Hypothesis rejected**: the plan's §5 guess ("~100% end-of-run again") was wrong — dropsim95 measured 88.5–91.7% (coupon math + cascade efficiency). The sim decided, not the guess.
4. B-scan of 7 configs at 20k runs × 3 profiles → B2a in band (70.9 / 69.0 / 67.0%).

## Why it slipped through

- **Sim never persisted.** `dropsim*.js` lived in `/tmp`; the "persist the simulator to `.agents/sims/`" action item from `postmortem-drop-sim-perfect-play.md` was never done — so the phantom-130 model was silently re-encoded instead of being corrected.
- **No frozen-rate guard.** The sibling action item ("frozen-rate eval asserting exact `CARD_DROP_RATES`/`WIN_DROP_RATES`/`RAMP_DROP`") was never done — the drift had no tripwire.
- **Tests not gated.** Vitest is absent from build/lint; the 17 stale assertions shipped red for two releases with zero signal.

## Validation

- dropsim95, B2a, 20k runs × 3 profiles: end-of-run **70.9 / 69.0 / 67.0%** (band 65–75), **0 dupes** pre-full-set, full set 0% of runs (~2–3 playthroughs to 95/95), rare+ ≈ 26/run (leg ~3.4)
- `tests/unit/alphabet-adventure.test.ts`: **144/144 pass** (was 17 failed); exact B2a base/max values pinned; integrity block rewritten (3-entry table, null-largest, monotone interpolation — the sum-to-100 assertion was a stale design assumption: the cumulative roll deliberately leaves a null fall-through)
- `npx tsc --noEmit`, eslint, `npm run build` clean
- **Not validated**: live browser playtest of the new rates (Docker paused — deferred; save/load, checkpoint resume, win-roll reveal, Start Over still to be eyeballed)

## Action items

- **Browser spot-check** of drop flow + ladder 10/25/50/65/95 once the dev container is up (Owner: build agent; tracking: next session, `alphabet-adventure-rate-apply.md` Task 4)
- **Achievements expansion** plan (`alphabet-adventure-next.md` §B) remains the next approved-but-undone feature (Owner: user decision; separate plan, not this fix)
- None further — the frozen-rate contract now exists as unit pins; the sim is persisted at `.agents/sims/dropsim95.js`.
