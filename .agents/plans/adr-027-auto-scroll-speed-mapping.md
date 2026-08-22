# ADR-027 — Auto-scroll speed: fixed seconds-per-line mapping (T55)

**Date:** 2026-08-11 · **Status:** PROPOSED (user decision pending) · **Type:** User-directed change

## Problem
The auto-scroll speed display (T23, ADR-019 D14) derives "วินาที/บรรทัด" from typography:
`s/l = (fontSize × lineHeight) / (speed × 48)` — the engine scrolls at a FIXED
`speed × 48 px/s` regardless of font size. At default 16px × 1.8 the levels read
**0.6 / 0.3 / 0.2 / 0.1 / 0.1** — levels 4 and 5 are indistinguishable, and the
"seconds per line" figure changes when the font changes. The user wants a real,
fixed contract: **1 = 1.0 s/l · 2 = 0.8 · 3 = 0.5 · 4 = 0.25 · 5 = 0.1**.

## Decision (LOCKED by user 2026-08-11)
1. **Fixed map** `SECONDS_PER_LINE: { 1: 1, 2: 0.8, 3: 0.5, 4: 0.25, 5: 0.1 }`
   (speed 0 / negative → null = "ปิด", unchanged). Display = `ระดับ {n} · {s} วิ/บรรทัด`
   with `String(s)` formatting — renders `1 / 0.8 / 0.5 / 0.25 / 0.1` exactly.
2. **Engine inverts** so the s/l contract HOLDS regardless of typography:
   scroll rate `px/s = (fontSize × lineHeight) / SECONDS_PER_LINE[speed]`.
   One rendered line (`fontSize × lineHeight` px) takes exactly the mapped seconds.
3. `secondsPerLine` signature simplifies to `(speed)` — drops `fontSize/lineHeight`
   (the map is typography-independent). The reader effect reads
   `settings.fontSize × settings.lineHeight` itself.

## Rate table (16px × 1.8 → 28.8px line)
| Level | s/l | px/s NEW | px/s OLD | Delta |
|---|---|---|---|---|
| 1 | 1.0 | 28.8 | 48 | slower |
| 2 | 0.8 | 36 | 96 | slower |
| 3 | 0.5 | 57.6 | 144 | slower |
| 4 | 0.25 | 115.2 | 192 | slower |
| 5 | 0.1 | **288** | 240 | **faster** |

Level 5 at max typography (32px × 2.0 = 64px line) = 640 px/s — a deliberate fast
flick, rAF-bound, safe (≤5.3px/frame @120Hz). User accepted the range.

## Notes / boundaries
- Full view: engine uses the SETTINGS values (same source as the display → honest
  contract). Compact view renders a smaller real line → actual s/l slightly under
  the display (documented, accepted — measuring the rendered article is overkill).
- Same rAF loop, dt clamp (100ms), end-of-doc stop, pause-on-interaction, dock
  toggle (0 ↔ last level) — ALL unchanged.
- `AUTO_SCROLL_MIN/MAX` (0–5) + storage validator unchanged — no migration.

## Resource cost
None — same single rAF loop; slower rates scroll less. Load: client.

## Tests (must repin)
- `tests/lawlib/seconds-per-line.test.ts` — vectors rewritten (typography-independent).
- `tests/unit/lawlib/settings-panel.test.tsx` — display pins :666 (0.6→1), :671
  (0.2→0.5); :675 (0.1) value-coincidentally stays; reduced-motion block verified.
- Grep ALL `วิ/บรรทัด` pins. Eval lawlib: no auto-scroll pins (verified 2026-08-11).

## Commit
`feat: auto-scroll speed fixed s/l mapping — 1/0.8/0.5/0.25/0.1 (T55)`
