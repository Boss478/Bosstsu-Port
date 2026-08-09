# Report: 95-slot drop-economy re-sim — shipped vs. alternatives

Date: 2026-08-02 · Sim: `.agents/sims/dropsim95.js` (persisted, deterministic seeds, 20k runs × 3 kid profiles per config) · Supersedes the §5 open item of the 130-cards plan.

## 1. Model (verified against source)

- 95 slots: common 21 / uncommon 21 / rare 19 / ultra-rare 17 / legendary 17 (`cards.ts:16-104`)
- No-dup `pickLetter` (shuffled pool per tier) + cascade `resolveDropTier`; dupes only when a tier is exhausted
- Playthrough: 30 sub-stages / 748 corrects (`buildStages` verified); wrong-answer model per stage type (easy 2/5/10 %, typical 5/10/20 %, struggling 10/20/35 % for match/fill/typing); match `WRONG_LIMIT=2` auto-advance; wrong ⇒ chain 0; sub-stage start ⇒ chain 0
- **Fidelity fix vs dropsim26**: `applyCardDrop` (chain−5, dropPower+1 cap 10) now applies on **every** drop — per-correct *and* win — matching `useGameActions.ts:317,319` (dropsim26 only applied it on win drops; it was win-only by accident)

## 2. Results — end-of-run collection (95 slots)

| Config | easy | typical | struggling | Full-set % of runs (typ.) | Mid-run s15 (typ.) | Events/run (typ.) | Dupes/run (typ.) |
|---|---|---|---|---|---|---|---|
| **R1 (shipped, v1.10.75)** | 91.7 % | **90.1 %** | 88.5 % | 13.6 % | 52.0 % | 86.1 | 0.5 |
| B1 (light trim) | 81.0 % | 79.1 % | 77.1 % | 0.4 % | 45.3 % | 75.2 | 0.0 |
| B2 (scan) | 69.9 % | 68.1 % | 65.9 % | 0.0 % | 39.0 % | 64.7 | 0.0 |
| **B2a (recommended)** | **70.9 %** | **69.0 %** | **67.0 %** | 0.0 % | **39.5 %** | **65.6** | 0.0 |
| B2b (scan) | 70.1 % | 68.2 % | 66.1 % | 0.0 % | 39.1 % | 64.8 | 0.0 |
| R2 (26-slot trim) | 64.7 % | 62.7 % | 60.6 % | 0.0 % | 36.0 % | 59.6 | 0.0 |
| R3 (26-slot band attempt) | 42.9 % | 40.8 % | 38.5 % | 0.0 % | 23.5 % | 38.7 | 0.0 |

Proposed band (from sim plan): end-of-run **65–75 %** · full set **< 40 %** · s15 **40–55 %** · dupes 0 pre-full-set.

## 3. What's wrong with the current economy (R1)

The plan's ~100 % hypothesis was wrong (cascade + coupon math keeps it at ~90 %), but R1 is still clearly over-generous:

- **88.5–91.7 % end-of-run** — common (99 %), uncommon (99 %), and rare (91–95 %) tiers are fully owned in almost every run; only ultra (65–79 %) and legendary (9–19 %) remain
- **Front-loaded**: by sub-stage 15/30 the collection is already 52 % complete; the back half of the campaign is a near-complete set with almost nothing left to chase
- **~25 win drops/run** (85 % win-roll chance) — a guaranteed rare+ every ~1.2 sub-stages makes rare+ feel like a participation trophy (43+ rare+ events/run)

## 4. What to change (recommended config: B2a)

Two constant edits in `constants.ts` only — no DB, no schema, no save migration (collections stay valid subsets):

| Table | Current (R1) | B2a |
|---|---|---|
| `CARD_DROP_RATES` (per-correct) | none 93→82 / common 3→6 / uncommon 2→4.5 | **none 95→88 / common 2.2→4.4 / uncommon 1.4→3.2** |
| `WIN_DROP_RATES` (sub-stage clear) | none 15 / rare 43 / ultra 30 / leg 12 | **none 32 / rare 36 / ultra 22 / leg 10** |
| `RAMP_DROP` | floor 0.05 → cap 2.0 @ chain 20, split 60/30/10 | **unchanged** |

Result (B2a, 20k runs): end-of-run **70.9 / 69.0 / 67.0 %** (all three profiles inside the 65–75 band, spread only ~4 pts), full set **0 %** of runs (deck completion = multi-run goal: ~3 runs to 95/95 at ~66–67 new cards/run), **0 dupes**, mid-run s15 **38–41 %** (just under the 40–55 ideal — the trade for a tight end-of-run band; acceptable), rare+ ≈ **26/run** (rare ~14.7, ultra ~8.4, legendary ~3.4 — chaseable but not free).

Why this shape: per-correct rolls give ~70 % of events (common/uncommon + small ramp), the win table gives ~30 % (rare+); the win-table trim (85 % → 68 % win chance, rare 43→36, leg 12→10) is the main pacing lever.

## 5. Validation notes

- R1 duplicates the 26-slot finding direction (drops/run ≈ events/run since cascade converts) while showing 95 slots land ~90 %, not 100 % — the sim's fidelity fix matters little at the tail (dupes ≈ 0.3–0.7/run at R1)
- Config spread sanity: R1 ≫ B1 ≫ B2a/B2 > R2 > R3 — monotone in both tables as expected
- No code changed yet — **decision gate: user approval of B2a (or B2/B2b as alternates) before editing `constants.ts`**

## 6. Follow-ups (from earlier action items)

- Frozen-rate regression eval `.agents/evals/card-drop-rates.md` asserting the exact final `CARD_DROP_RATES` / `WIN_DROP_RATES` / `RAMP_DROP` values (postmortem action item, still open)
- Live browser playtest of drop flow with new rates (save/load, checkpoint resume, win-roll reveal, Start Over)
