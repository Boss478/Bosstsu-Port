# ADR-021 — Content-Surface Glass + Dynamic Blur (T17)

**Date:** 2026-08-09 · **Status:** Accepted (user decisions 2026-08-08, senior APPROVE WITH CHANGES 2026-08-09)
**Plan:** `.agents/tasks/t17-content-glass.md`

## Context
The glassmorphism system (ADR-019 D8/D9, T12b) drove ONE slider (`glassOpacity` 0–100, default 35) into static CSS vars (`--lawlib-glass-bg-*`, `--lawlib-glass-blur` 12px / `--lawlib-glass-blur-xs` 4px) consumed by dock + search + tooltip. Two gaps surfaced during user review (2026-08-08):

1. **Inconsistency**: hover tooltip = glass, but the compact-view click popover (`ArticlePopover`) = solid `bg-white` — "click ไม่ glass but hover is glass" (user)
2. **Readability/identity**: content-bearing surfaces (tooltip/popover show reading text) need MORE opacity than chrome (dock/search); blur should scale with the slider, and NO surface should ever be fully opaque

## Decisions

### G1 — Content surfaces join glass (tooltip + popover)
- `LawTooltip` (both desktop + sheet variants) and `ArticlePopover` (compact view) use the new `.lawlib-glass-content` class — same system, different formula
- New vars: `--lawlib-glass-content-bg-light/dark`; new blur var `--lawlib-glass-blur-content`
- Hub buttons inside tooltip (bg-white/90) + repealed badge block (ArticleView) stay SOLID — interactive/dense elements keep their own surface (same rationale as before)

### G2 — Content alpha formula (piecewise, anchored at slider default 35)
```
contentAlpha(v) = v <= 35 ? 0.55 + (v/35)*0.15 : 0.7 + ((v-35)/65)*0.25
```
- Anchors: **0 → 0.55 (min) · 35 → 0.7 (default) · 100 → 0.95 (max)**
- Content surfaces never go below 0.55 and never fully opaque (stays glass)
- **AMENDED 2026-08-09 (UI review HIGH)**: floor raised 0.5 → 0.55 — at slider 0 the old 0.5 floor measured 3.04:1 (fails WCAG AA 4.5:1 over dense Thai text); with 0.55 + ink slate-800 → 4.96:1 @min. Default 0.7 and max 0.95 UNCHANGED.
- Round 3 decimals (float noise guard); clamp input [0,100] FIRST

### G3 — Dock/search alpha: cap 0.95 at max (was 1.0)
```
dockAlpha(v) = min(v/100, 0.95)
```
- Default 35 → 0.35 unchanged ("real glass 30–40%", D8: 0% = transparent preserved)
- **At slider 100 → 0.95, not 1.0** — no surface is ever fully opaque ("max at 100%, opacity also 0.95 too" — user)

### G4 — Dynamic blur (GPU-kill rule REMOVED)
- Blur now scales LINEARLY with the slider (user anchors 0/35/50/75/100, approved min→max scaling):
  - `dockBlur(v) = 1.5 + 0.02v` → **1.5–3.5px** (was static 4px)
  - `searchBlur(v) = 3 + 0.02v` → **3–5px** (was static 12px)
  - `contentBlur(v) = 6 + 0.02v` → **6–8px** (new)
- **"slider 100% → blur none" is REMOVED** — blur scales continuously to its max. Perf rationale: max 8px < old static 12px, surfaces are small; backdrop-filter on 3 small layers is fine on 2 vCPU/4GB (no raise to DB pool or rate limits — client-side GPU only)
- Blur px strings rounded 1 decimal; CSS fallbacks match max values (dock 2px@35 · search 3.5px@35 · content 6.5px@35; search-field fallback 5px = max)

### G5 — Accepted trade-offs
- **Glass-over-glass**: tooltip (z-70 portal) can open over popover (z-40) → double-frost halo behind the tooltip. Accepted — pre-existing pattern, cosmetic (senior MINOR 2026-08-09)
- **Linear-vs-anchor deviation**: at v=35 linear gives 2.2/3.7/6.7px vs user table 2/3.5/6.5 — sub-pixel, imperceptible (user approved linear scaling)
- **Tooltip/popover body ink unified** to `text-slate-800 dark:text-slate-200` (was slate-700 vs slate-800 split — UI review MEDIUM; same article text must render with same ink on both glass surfaces)
- **Dock overlaps TOC at left positions** (top-left/mid-left, 64px column over TOC text zone) — accepted, pre-existing 8-position scheme consequence (UI review MEDIUM, 2026-08-09)
- **Footer overlap (T18 + T18-fix)**: tooltip/popover opening near the page bottom previously covered the footer logo/contact row (measured 448×61px) — fixed with footer-aware positioning: `computeTooltipPosition` rejects the below-position when it crosses `#site-footer` and above-space exists (flip above); branch-3 (relaxed below) got the same guard; the nothing-fits fallback prefers ending just above the footer (footerClear) when ≥ gap of headroom remains; ArticlePopover's narrow-screen below-fallback flips above the card + its mount effect clamps against the footer. Genuinely-unavoidable cases (tooltip taller than all available space) keep the documented fallback. z-index on the footer was REJECTED: no single value sits above the tooltip (z-70) but below the mobile bottom sheet (z-70) + search drawer (z-60) — footer text would float over full-screen surfaces. Dock/search drawer still float over the in-flow footer when scrolled to the end — inherent to fixed overlays, accepted. Tooltip closes on scrollend so no reposition reactivity is needed
- **Hierarchy flattens at slider 100** (content 0.95 == dock 0.95) — accepted NIT; content>chrome gap exists below ~85 (UI review NIT, 2026-08-09; alternative dock cap 0.90 rejected — keep formulas simple)

## Alternatives Rejected
- Popover stays solid (would keep the hover/click inconsistency)
- Single opacity formula for all surfaces (breaks readability floor for content + would raise dock default)
- Keep static blur (user explicitly wanted slider-scaled blur)
- ADR-020 number for this decision (taken by Next.js 16.3 upgrade — hence ADR-021)

## Consequences
- `.lawlib-glass`/`.lawlib-glass-xs` class lists unchanged — only their VAR VALUES now scale (dock 2px, search 4px @35)
- `GLASS_OPACITY_DEFAULT = 35` unchanged; slider UI unchanged (0–100 "%")
- Read/sepia: content glass applies via same vars (T12c); drawer input keeps paper (`.read/.sepia .lawlib-panel .lawlib-glass` override — verified no selector collision)
- Tests: pure functions (contentGlassAlpha/dockGlassAlpha/dockBlur/searchBlur/contentBlur) + class assertions; live verification at :3300 — all 9 cells (slider 0/35/100 × dock/tooltip/popover) match formulas, dark theme ✓
- Docs: changelog entry at release; memory + Obsidian persistence (reporter-doc)

## T19 note (2026-08-09) — tooltip side placement + 5-row hover preview
- **Side placement** (user request): when below/above can't fit, the tooltip places RIGHT of the trigger (`left = anchor.right + gap`, vertically centered, clamped), then LEFT (`anchor.left − w − gap`) — never horizontally overlapping the trigger ("covers the มาตรา being hovered" is fixed). Priority: below → above → RIGHT → LEFT → reduced-margin below → footerClear → fallback. Side branches carry the T18 footer guard (shift up above the footer when headroom allows). The old reduced-margin below branch (W3-4) is replaced by the side branches, with the reduced-margin below kept as the pre-footerClear safety net (W3-4 invariant).
- **5-row preview + ดูเพิ่มเติม** (user decision): HOVER opens clamped to `line-clamp-5` with a one-way expand button (sibling outside the clamped element — no max-h/overflow on the clamped branch); CLICK-PIN and keyboard open FULL text directly (click = intent to read). Applied to ALL three tooltip bodies (full article, digest-ref, glossary). Expand state lives at the LawTooltip root (position effect deps += expanded → expand re-runs placement); render-time reset on content swap (React-sanctioned prev-state pattern — NOT an effect).
- The reader wires `preview={!pinned && !openedByKeyboard}` (hook now exposes `pinned`); touch opens are not pins → the mobile sheet shows the same preview behavior.
- Unit: side-branch placement cases + preview/clamp/expand/reset + hover-vs-pin; live-verified at :3300 (1280×800 + 375px sheet).
