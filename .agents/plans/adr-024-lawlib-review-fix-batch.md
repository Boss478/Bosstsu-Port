# ADR-024 — LawLib Review-Fix Batch (T33–T37)

**Date:** 2026-08-10 · **Status:** Accepted (pending user approval) · **Release:** v1.12.3 (held)

## Context
User review of the LawLib Motion wave (post-approval, pre-release) found: (1) dock blur imperceptible, (2) dock/BTT vanish during theme VT ~0.5s, (3) group expand/collapse should animate height, (4) digest history expand/collapse same, (5) Full/Compact switch should be a sliding-color segmented control. Debug session (mantra) produced reproducible evidence for 1–2 (see SDO §1).

## Decisions

### D1 — Glass value remap (T33 + **T38 amendment 2026-08-10**)
**T33 (original):** dockBlur piecewise `v ≤ 35 → 4 + (2/35)v` · `v > 35 → 6 + (2/65)(v−35)` (was `1.5 + 0.02·v`); buttons `white/90 → white/60` + `slate-800/80 → slate-800/70` + blur 8px (`backdrop-blur-sm`, measured).
**T38 (amendment — user: "still not blur" on the SAME slider, tested all themes):** root cause — one slider drives alpha AND blur; alpha 8–95% made the panel near-solid (blur invisible at any value) + 4–8px too subtle. User locked: **alpha `0.28 + 0.002·v` (28–48%, 0.95 cap removed) · blur piecewise `v≤35: 2+(4/35)v` / `v>35: 6+(6/65)(v−35)` (2–12px)** — default v=35 unchanged (35% + 6px); blur visible through the panel at EVERY slider position. searchBlur/contentBlur/contentGlassAlpha/buttons unchanged.

### D2 — VT names forbidden on backdrop-filter surfaces (T34)
**Chrome captures a blank snapshot for elements with `backdrop-filter` + `view-transition-name`** (proven A/B, SDO §1.2). Rule (amends ADR-023 D3): a `view-transition-name` may be applied ONLY to surfaces whose subtree is blur-free. Affected (senior MAJOR-1 added Header): `vt-dock`, `vt-btt`, **`vt-header`**, `vt-tooltip` removed (crossfade with root — they don't move during theme switch, so no jump). Keep: `vt-scroll`, `vt-picker`, drawer/chip (solid verified). If a solid-bg surface is later given blur, it loses its VT name.

### D3 — Height animation D2 exception (T35/T36)
User-approved layout animation on exactly two surfaces: group expand/collapse + digest history expand/collapse, via `grid-template-rows: 0fr ↔ 1fr` 300ms `--ease-ios-out` + inner `overflow-hidden min-h-0` + existing content fade-rise 150ms; collapse animates (both directions); `hidden` → `inert` for a11y/focus; region node identity preserved; RM instant. **+ `restoreMemberFocus` guard fix (senior MAJOR-2): `el.offsetParent !== null` → `el.closest('[inert]') === null` (LawlibReaderClient ~:842).** ADR-023 D2 (compositor-only) stands everywhere else. FF degrades to discrete flip (grid-rows not interpolable there) — acceptable, collapsed state correct in all engines.

### D4 — Segmented pill (T37)
Full/Compact radio group → pill with sliding knob: `translate-x-0 ↔ translate-x-full` **200ms `--ease-ios-out`** (user-locked 2026-08-10; compositor ✓), `flex-1` on both buttons (senior MINOR-5 — label widths differ), text `transition-colors` 200ms; ARIA radiogroup/radio + arrow keys unchanged; RM instant.

## Consequences
- Two engine bugs (perceived missing blur, VT blank snapshots) closed with values + rule, not hacks.
- Layout animation limited to 2 user-approved surfaces; per-interaction cost only (no 50–100 user impact).
- Release v1.12.3 remains held until user reviews this batch.
