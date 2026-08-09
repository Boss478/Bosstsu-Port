# Report: Alphabet Adventure Scrutiny Fixes

**Date:** 2026-06-05 16:15  
**Version:** v1.9.41  
**Status:** Done

## Summary

Implemented 6 fixes from the Alphabet Adventure scrutiny:
- **Gradient violations** (2 files): MenuScreen + AlphabetAdventureClient — `bg-gradient-to-r` → `bg-amber-500`
- **Easy mode toast** (AlphabetAdventureClient): Added "+1 Drop Power" badge below card frame
- **Drop rate rebalance** (cards/cards.ts): More generous rates, better streak scaling
- **Per-tier pickLetter fairness** (cards/cards.ts): Shuffle bag per CardTier prevents repeats
- **Drop power tooltip** (GameScreen): Hover tooltip on active fill-round cell
- **Card screen sounds** (CardScreen): Entrance chime + tab switch click

## Files Changed

| File | Change |
|------|--------|
| `MenuScreen.tsx` | Gradient → flat color on beta CTA button |
| `AlphabetAdventureClient.tsx` | Gradient → flat on BETA badge; +1 Drop Power badge in toast; pass dropPower/effectiveStreak/playSequence props |
| `GameScreen.tsx` | Added `dropPower`/`effectiveStreak` props + hover tooltip on active fill-round cell |
| `cards/cards.ts` | Rebalanced DROP_RATES; per-tier shuffle bag for pickLetter |
| `CardScreen.tsx` | Added `playSequence` prop, entrance + tab-switch sounds |

## Verification

- `npm run build` ✅
- `npm run lint` ✅
