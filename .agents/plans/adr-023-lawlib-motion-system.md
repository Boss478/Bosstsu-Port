# ADR-023: LawLib Motion System — Apple-style Fluid Animations

**Status**: Approved by user (design directive: "fluid, beautiful like apple-style", 2026-08-09)
**Scope**: LawLib module animation wave (T24–T32) · Release target: **v1.12.3** (patch — user decision 2026-08-09)

## Decisions

### D1 — Apple-style motion token system
Four easing curves + four durations as CSS custom properties in `:root`, mirrored as Tailwind v4 `@theme` keys:
- `--ease-ios-out: cubic-bezier(0.22, 1, 0.36, 1)` — primary entrance (menus, panels)
- `--ease-ios-expo: cubic-bezier(0.16, 1, 0.3, 1)` — large slides (drawers, sheets)
- `--ease-ios-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` — overshoot for menus/tooltips/icon swaps (spring feel, CSS-only)
- `--ease-ios-in: cubic-bezier(0.4, 0, 1, 1)` — exits (faster, never overshoot)
- `--dur-micro: 100ms · --dur-std: 200ms · --dur-med: 300ms · --dur-large: 400ms`
- **Why**: Apple fluidity comes from fast-start/long-tail easing + consistent rhythm; single source of truth instead of scattered `transition-all duration-150`.
- **Rejected**: WAAPI true springs (JS + deps, inconsistent), Tailwind default `ease` (linear-ish, not fluid).

### D2 — Compositor-only hard rule
Animate ONLY `transform` + `opacity`; `background-color`/`color` allowed as paint-only tints (≤200ms, small areas). **Zero layout-property animation** (no top/left/width/height/font-size). `will-change` only during animation, removed on `animationend`.
- **Why**: 60fps (web.dev/MDN); our existing keyframes already follow this (globals.css:1580 comment).
- **Consequence**: typography sliders (font-size/width/line-height) are **deliberately excluded** — layout reflow every tick = jank (user-approved exclusion).

### D3 — Theme change via View Transitions API (unique names, discrete commits)
`document.startViewTransition(() => flushSync(setTheme(next)))` in ThemeProvider event handlers; **gated**: lawlib routes only (pathname gate; other pages keep the body-fade fallback), not reduced-motion (**JS gate is mandatory** — the CSS reduced-motion kill does NOT cover `::view-transition-*` pseudo-elements), `next !== theme` guard, feature-detect; never during SSR/render.
- **Fixed elements**: each gets a **UNIQUE** `view-transition-name` (e.g. `dock-chrome`, `site-header`, `back-to-top`, `scroll-progress`, `lawlib-tooltip`, `lawlib-picker-popover`, `bottom-nav`) — senior-verified empirically: `none` is the no-op default (root group includes everything unnamed), and duplicate names on multiple elements make the browser skip the transition. Dock root needs a NEW dedicated class (`.lawlib-dock` matches 3 nodes). Scope: site-wide fixed inventory since ThemeProvider is global.
- **Discrete commits only**: theme buttons + paper-tone preset chips use VT; the paper-tone **slider never does** (snapshot-per-tick storm → frozen crossfades).
- **Why**: true whole-tree crossfade = Apple-like; single call.
- **Rejected**: animating colors on 100s of elements (layout/paint thrash), CSS-only overlay trick (fake). React `<ViewTransition>` (19.2.8) noted as optional alternative — not required.

### D4 — Exits are symmetric, faster, no overshoot
Every entrance has a mirrored exit (symmetry — 60fps.design Show/Hide): exit duration = 60–75% of entry, `--ease-ios-in`, implemented via `closing` state + delay-unmount (reuse `DOCK_ANIM_MS` pattern, LawlibDock.tsx:184). Tooltip exit is the flagship case — its `closing` state lives in **`useLawTooltip` (the hook, not the component)** because unmount is hook-driven (ReaderClient:1774); `openTooltip` cancels a pending exit timer (reuse the openContentRef fire-time gate) so hover-corridor reopen never dies to a stale timer; **keyboard closes skip the exit** (e2e Tab contract). JS gates skip delay-unmount under `prefers-reduced-motion`.

### D5 — Contextual origin (linkage)
Menus/popovers grow from their trigger: `transform-origin` per placement (L2 `more` flip per POSITION_CONFIG; tooltip placement origin already exists, LawTooltip.tsx:860; dock L1 grows from dock icon). Dock position change = keyframe re-trigger with `--lawlib-dock-slide` direction (no teleport, no FLIP measurement).
- **Rejected**: FLIP + ResizeObserver (complexity, marginal gain).

### D6 — Stagger capped at 8, mount-only
CSS `animation-delay: calc(var(--i) * 60ms)` on keyed mounts (search results, drawer lists, law-list cards); cap 8 (long tails feel slow — subtlety); animation (not transition) so re-renders don't re-stagger.

### D7 — Reduced-motion honored everywhere
All new keyframes inside existing global kill scope (globals.css:657–666) + JS gates for every delay-unmount/exit; VT auto-skip; e2e/unit contract unchanged (keyboard tooltip path never delayed).
- **D8 — kill must zero `animation-delay` too**: the global kill only zeroes `animation-duration`; stagger (`animation-delay: calc(var(--i) * 60ms)` + fill-mode) would leave items invisible up to 480ms under reduced motion. T24 adds `animation-delay: 0ms !important` to the kill (senior MAJOR).

## Resource cost
Client-side only: transient will-change layers (1–2), transient VT snapshots (~300ms, <5MB), +2–3KB CSS. **Zero** server/DB/API impact; pool 3, rate limits, VPS RAM unaffected; no new dependencies.

## Non-decisions (explicitly NOT in scope)
- Typography slider animation (layout — excluded by design)
- Page transitions between routes (only in-page surfaces)
- Games/other modules (LawLib only this wave; tokens reusable later)

### D9 — Per-surface locked values (user-chosen one-by-one, 2026-08-09)
| Surface | Duration | Style |
|---|---|---|
| Dock L2 menu | 200ms (exit 140ms) | pop spring จาก ⋯ |
| Dock L1 expand/icon | 200ms | pop + morph + glass ramp |
| Dock position | 100ms | fade + slide ทิศทาง (transform raise) |
| Auto-scroll chip | 150ms | fade-rise + ระดับ pop |
| Micro-interactions | 150ms | กด-ปล่อย spring |
| Theme change | 400ms | VT custom keyframes (directional fade-through) |
| Theme icon | 300ms | หมุนจาง + pop morph |
| Paper tone chips | 400ms | VT โทนอุ่น + chip pop |
| Glass alpha slider | — | **คงเดิม** (instant, user decision) |
| Tooltip entry | 150ms | rise ตามทิศทาง placement |
| Tooltip exit | 120ms | mirror + จางหา trigger |
| ArticlePopover | 200ms | pop + rise + overshoot |
| Settings/picker popovers | 300ms | pop + rise + stagger 40ms |
| Digest flash | 150ms | bg+box-shadow + ring pulse |
| Drawer + overlay | 400ms | fade + สไลด์ expo + stagger 40ms |
| Compact group | 150ms | fade + rise + chevron spring |
| Focus mode | 300ms | fade + scale 0.995 + indicator spring |
| Page fade-in | 400ms | fade + rise + stagger 60ms cap 8 |
| Search stagger | 60ms/item | fade + rise + ทิศทางพิมพ์ cap 8 |
| Law list entrance | 60ms/item | fade + rise + hover spring |

Pattern: user consistently chose **Quality styles with Default/Fast timings** — rich motion at snappy durations. All stay compositor-only, ≤400ms, reduced-motion safe.

### D10 — Composition rule (senior T24-review finding)
One `animation` per element (CSS shorthand overwrites). Combined behaviors need **nested wrappers** (outer fade-rise + inner pop-in) or inline overrides — never two animation classes on one node. Consumers MUST set `transform-origin` per placement (morph-in → dock icon; pop-in/out → trigger per POSITION_CONFIG; tooltip-out inherits LawTooltip.tsx:860) and override durations where D9 differs from class defaults (e.g., page fade-in 400ms vs `.lawlib-fade-rise` 300ms — `animation-duration` after the shorthand).
