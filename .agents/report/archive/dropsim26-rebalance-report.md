# Report: Drop-economy re-sim on the REAL 26-card collection

Date: 2026-08-01 · Sims: `/tmp/dropsim26.js` (R1/R2/R3), `/tmp/dropsim26b.js` + `/tmp/dropsim26c.js` (B-scan) · 20k runs × 3 kid profiles

## 1. The discovery

The shipped drop economy (v1.10.75) and its validation were calibrated on a **130-slot collection that does not exist in the game**. The game's collection is **26 unique cards** — each letter belongs to exactly one tier (`cards.ts:16-22`):

| Tier | Letters | Slots |
|---|---|---|
| common | E T A O I S | 6 |
| uncommon | N H R D L C | 6 |
| rare | U M W F G | 5 |
| ultra-rare | Y P B V K | 5 |
| legendary | J X Q Z | 4 |
| **Total** | | **26** |

The old sim (`dropsim4.js:67`) modeled every tier as containing all 26 letters (5×26 = 130). The in-game UI (`GameOverlays.tsx:163` "X / 26 cards") is **correct**; the sim, the "67.6% end-of-run" validation, the changelog claim, and the achievements draft were wrong. Two stale code comments in `cards.ts:165,183` ("once all 130 are owned") should be fixed regardless of direction.

## 2. Shipped rates (R1) on the real 26 slots — 20k runs × 3 profiles

| | easy | typical | struggling |
|---|---|---|---|
| End-of-run collection | **100.0%** | **100.0%** | **100.0%** |
| Full set reached by sub-stage | 5.9 / 30 | 6.3 / 30 | 7.0 / 30 |
| Runs completing 26/26 | 100% | 100% | 100% |
| Dupes/run (post-completion) | 61.5 | 57.0 | 51.0 |
| Drops/run (pc + win) | 20.9 + 5.1 | 20.4 + 5.6 | 19.9 + 6.1 |

**Verdict**: with no-dup `pickLetter` + cascade, a full playthrough (~748 corrects) yields far more drops than slots. Every kid completes the whole collection by sub-stage ~7 of 30, then pulls 50+ dupes. The 60–70% replay band, dropPower self-limiting, and ramp all become irrelevant. The "67.6/66.3/64.9% in-band" claim in the v1.10.75 changelog/post-mortem is invalid for the real game.

## 3. Can the 60–70% band be hit on 26 slots? (B-scan)

The band requires ~17 new cards/run, i.e. **~2.3× fewer drops than shipped**. Profile spread is small (drops/run 15–20 across profiles since corrects are fixed at 748), so one config can roughly fit all three. Best fit found (B-final: per-correct common 0.45→1.1 / uncommon 0.3→0.75, win None 82 / rare 11 / ultra 4.2 / leg 1.8, ramp unchanged):

| | easy | typical | struggling |
|---|---|---|---|
| End-of-run | 77.4% | 69.0% | 58.6% |

Close to the bands but slightly over/under at the edges. Pushing further makes cards extremely rare: a card every ~40–50 answers, rare+ maybe 1–2 per full playthrough, "Full Deck" essentially never. **The band is only satisfiable by making the card system feel stingy** — the collection is simply too small (26 no-dupe slots) for a "60–70% at end of run" chase economy.

## 4. The alternative: make the collection actually 130 (Option C)

Every tier gets all 26 letters (5×26 = 130 slots). This is what the entire prior design assumed:
- Shipped rates then produce the original validated results (67.6/66.3/64.9% — recompute to confirm, cheap)
- Cascade, dropPower, no-dup pickLetter, the ramp, and the rare+ chase all become meaningful again
- Achievements draft (50/90/130 ladder, tier sets, letter_full) becomes valid
- UI: CardScreen renders 130 slots automatically (`totalPossible` derives from `TIER_LETTERS`); only `GameOverlays.tsx:163,169` hardcodes "26" (fix to derived total)
- Existing saves migrate cleanly (cards stored as letter+tier keys remain valid)
- `cards.ts:165,183` comments become true instead of stale

Cost: loses the "rarer letters are rarer cards" flavor (each letter = one card), and the collection grid becomes 5× longer.

## 5. Recommendation

**C (130 slots)** — it makes the shipped economy, the sims, the achievements plan, and the docs all true with minimal code change. **B (stingy rebalance)** preserves the current 26-card collection but guts the fun; **A (accept 100%)** makes the whole card system a mid-game instant-win. Direction is the user's call; no code has been changed for the economy.

## 6. Also flagged (regardless of choice)

- `cards.ts:165,183` stale "130" comments → fix wording
- v1.10.75 changelog entry + post-mortem contain the invalid 60–70% claim → add correction note
- Achievements draft: 7 entries impossible at 26 (card_50/90/130, letter_full, 3× all-26 tier sets) — user deferred until this report; under C they become valid
