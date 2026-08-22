# ADR-018 — LAWLIB Tooltip: Click-to-Pin + Glassmorphism Scope

**Date:** 2026-08-06 · **Status:** Proposed (pending user approval + senior-engineer review)

## Context
LAWLIB tooltip (glossary terms, article refs) opens on hover only for mouse users. The tooltip contains interactive controls (copy, jump to full text, เปิดมาตรานี้) that become unreachable on desktop: moving the pointer from the trigger toward the tooltip fires `pointerleave` → tooltip closes. This is a functional break AND a WCAG 1.4.13 (Content on Hover or Focus) failure — hoverable content with interactive elements must remain reachable by pointer.

Two parallel design reviews (ui-ux-designer, a11y-reviewer) also produced a fix list for the glassmorphism treatment of LAWLIB surfaces. User instructed: keep the cookie consent bar unchanged; plan the rest.

## Decisions

### D1 — Tooltip interaction model: "hover = preview, click = pin" (C-lite)
- **Mouse click** on a trigger enters **sticky mode** (reuse existing keyboard-mode sticky infra — Esc / pointerdown-outside / X / toggle re-click closes)
- **Hover** remains a quick preview with a **union-zone guard**: pointermove checks cursor inside (trigger ∪ tooltip ∪ corridor ~12px) → close cancelled; do NOT rely on relatedTarget (broken under React 19 synthesized events)
- ~~Auto-promote (hover-dwell ≥2.5s → pinned)~~ — **REMOVED by user decision 2026-08-06**: hover = preview only; pinning requires an explicit click
- **Drag-select guard:** mouse click with movement ≥10px must not open/pin (mirror existing touch guard)
- Touch (tap = pin) and keyboard (Enter/Space = pin) behavior UNCHANGED

**Rejected:**
- B (hover bridge only) — fragile geometry/corridor math, the exact class of bug currently live; still needed only as a belt-and-suspenders for preview
- Hover-only tooltip with interactive content — WCAG fail, rejected outright
- A (click-only, no hover) — loses discoverability; kept hover preview

### D2 — Glassmorphism scope: glass = design language (chrome + surfaces), reading body near-opaque
- **User directive (2026-08-06):** Glassmorphism is the MAIN design focus — a 3-tier system (`glass-1/2/3` Tailwind v4 utilities) applied to all chrome AND surfaces: chips/nav = glass-1, search/dock/TOC/law cards = glass-2, drawer panels/tooltip/article+digest cards = glass-3
- **Reading body uses glass-3 near-opaque (≥85-90%)** — every surface measured composite AA (text ≥4.5:1, non-text ≥3:1) in light/dark/read; near-opaque tier is the contrast mitigation (overrides the earlier "content stays solid" reviewer recommendation per user direction)
- **No ambient background** (user decision 2026-08-06) — glass reads via translucency + borders + shadow; subtle by design on the existing plain background
- **Scope: LAWLIB first** — the site already uses glass chrome site-wide (nav pill, FAB, submenus, cookie bar); LawLib is the laggard and gets the language first; site-wide consistency can follow later
- Read mode (paper theme): glass chrome turns paper-toned AND **backdrop-filter disabled** (opaque surface + blur = dead GPU work on fixed elements)

### D3 — Cookie bar unchanged
User decision 2026-08-06: `bg-white/30` consent bar stays as-is despite contrast finding — **no change**.

### D4 — Glass token scale PROMOTED (was deferred)
`.glass-tier` + `--backdrop-blur-*` dead utilities → replaced by `@utility glass-1/2/3` as the backbone of the glass design language (part of T0, Wave 1).

## Consequences
- Desktop users can reach copy/jump/เปิดมาตรานี้ (functional fix) + WCAG 1.4.13 compliance
- Sticky-mode semantics unified across pointer/keyboard/touch → simpler mental model, single code path
- Read mode GPU cost drops (no blur compositing on fixed dock)
- Glassmorphism becomes the coherent LAWLIB design language (tiers replace 6 ad-hoc blurs); LawLib joins the site-wide glass chrome; reading surfaces stay AA-verified via near-opaque tier
- Scope: 10 tasks ≈ 6.5-7d (plan rev.4: T0-T6 desktop, T9 mobile, T10a/T10b dock v2), client-side only; zero DB/server impact (pool 3, 1 vCPU, 50-100 concurrency unaffected)

## Files touched (plan)
`useLawTooltip.ts` · `LawTooltip.tsx` · `SearchInput.tsx` · `LawlibReaderClient.tsx` · `TocSidebar.tsx` · `CompactView.tsx` · `Footer.tsx` · `globals.css` · lawlib evals
