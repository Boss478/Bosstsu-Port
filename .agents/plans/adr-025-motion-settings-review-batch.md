# ADR-025 — Motion + Settings Review Batch (user one-by-one review 2026-08-10)

Status: **LOCKED by user** (reviewed item-by-item) — implementation pending (T39–T43).
Supersedes/adjusts: ADR-021 (T17 glass formulas — S1), ADR-024 D1 (T33/T38 — S1, M-timings).

## 1. Settings changes

| Ref | Setting | New range (min · default · max) | Notes |
|---|---|---|---|
| S1 | Glass slider | opacity **0.05–0.80** · blur **0.5–8px** · default **50** | **FINAL lock 2026-08-10 (6th pass — user: "Dock Panel: default dot to 50% · opacity → **5–80%** · blur 1-12→0.5-8px"):** ONE slider, **pure linear**: alpha `0.05 + 0.0075·v` (5→42.5→80% at 0/50/100) · blur `0.5 + 0.075·v` (0.5→4.25→8px — toFixed(2) preserves the exact 4.25 at 50) · `GLASS_OPACITY_DEFAULT` 35 → **50** (all three copies + legacy `75 → new default` migration). search/content formulas UNCHANGED (natural values at 50: search 4px · content alpha 0.758/blur 7px). Rejected: piecewise anchoring. ⚠️ Accepted: alpha 80% top still hides blur; default look changes (42.5%/4.25px vs old 35%/6px). Buttons/L2 fixed 8px/60% untouched. |
| S2 | Font quick buttons | **8/12/16/24/32** (was ส/M/L/XL = 14/16/18/24) | Slider range 8–32 step 1 + default 16 unchanged. Legacy stored 14/18 stay valid (in-range). |
| S3 | Line height | **1.2–2.4** · default 1.8 · step 0.1 | Min raised (was 1.0), max raised (was 2.0). |
| S4 | Content width | **80–160%** · default **120%** · step 1 | Max +40, default +20 (wider reading column). Check layout at 96ch on desktop. |
| S5–S10 | — | unchanged | |

## 2. Motion timing changes (all --ease-ios-* unless noted)

| Ref | Surface | Old | **New** |
|---|---|---|---|
| M1 | Theme crossfade (VT) | 400ms | **500ms** ios-out |
| M2 | Dock entrance in / out / re-entry | 150 / 150 / 100 | **200ms expo** / 150 / 100 |
| M3 | Dock raise | 100ms | **150ms spring** |
| M5 | L2 menu pop in / out | 200 spring / 140 | **250ms spring** / 140 |
| M9 | Focus fade | 300ms | **500ms** ios-in |
| M11 | Tooltip in | 150ms ease-out (unthemed) | **200ms --ease-ios-expo** (D4 closed) |
| M12 | Tooltip out | 120ms | **150ms** ios-in |
| M16 | Page entrance | 400ms | **500ms** |
| M17 | Group expand/collapse | 300ms | **400ms** (inner fade 150ms stays) |
| M18 | History expand/collapse | 300ms | **400ms** (inner fade 150ms stays) |
| M19 | Pill knob | 200ms | **300ms** ios-out |
| M20 | Chevrons (TOC + history) | 150ms default | **200ms spring** (unify with compact) — D3 closed |
| D1 | Press site-wide (active:scale-95) | 75ms | **100ms** |
| M4/M6/M7/M8/M10/M13/M14/M15/M21 | keep | — | unchanged |

## 3. D2 — Motion preference (NEW setting, 3 tiers)

- **Tiers:** `quality` (full — DEFAULT) · `fast` (halve every duration) · `disable` (instant — the old RM kill).
- **UI:** 3-option picker in LawLib settings ⚙️ (device-wide storage `lawlib:motionPreference`; absent → `quality`).
- **Mechanism:** `data-motion` attribute on `<html>` set by JS (lawlib layout, pre-paint script like the theme one to avoid motion flash).
  - `[data-motion="fast"] { --motion-factor: 0.5 }` — ALL durations become `calc(Xms * var(--motion-factor, 1))` (globals.css keyframes + transitions + Tailwind v4 `--duration-*` theme vars where used).
  - `[data-motion="disable"]` → the existing 0.01ms !important kill + delay 0.
  - Theme VT (JS-driven): duration = 500ms × factor; Disable → instant (skip VT, plain class swap).
- **RM interplay (user-locked, confirmed 2nd pass):** when OS `prefers-reduced-motion: reduce` → the picker shows all 3 options but **QUALITY is DISABLED** (visible, greyed, with hint "ระบบลดการเคลื่อนไหวเปิดอยู่"); Disable/Fast selectable. Stored `quality` under RM behaves as **fast** (confirmed — not disable).
- **Labels (user-locked):** tiers = **ปกติ / เร็ว / ปิด** (quality/fast/disable). Glass slider label → **"กระจก (ความทึบ + ความเบลอ)"** (was "ความทึบ (เฉพาะ dock + ค้นหา)").
- Current `@media (prefers-reduced-motion: reduce)` blanket kill is replaced by the attribute system (pre-paint sets the attr before first paint, so no motion flash).

## 4. D5 — stale copy

Remove the helper line under the glass slider ("100% = ทึบและไม่เบลอ (ประหยัดพลังงาน)") — wrong since T17. No replacement text.

## 5. Scope notes

- Search blur (3–5px) / content alpha (0.55–0.95) / content blur (6–8px) / toolbar / autoscroll / paper / font family/weight/spacing: unchanged.
- All changes live in: LawlibGlassVars.tsx · LawlibPickers.tsx · useReaderStorage.ts · globals.css · ThemeProvider.tsx (VT duration) · LawlibDock.tsx (M2/M3/M5/M9) · LawTooltip.tsx (M11/M12) · CompactView.tsx (M17/M20) · LawlibReaderClient.tsx (M18/M19/M20) · site-wide press classes (D1).
- Tests to update: glass-formulas (S1 math), settings-panel (S3/S4 ranges), reader-motion (M17–M20), tooltip (M11/M12), dock tests (M2/M3/M5), new motion-preference tests.
- Release: folds into the held v1.12.3 package (release still HOLD).
