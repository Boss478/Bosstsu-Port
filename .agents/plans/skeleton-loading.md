# Plan: Skeleton Loading Screens
**Version:** 1.5.18 → 1.5.19
**Date:** 2026-04-21
**Status:** In Progress

---

## Goal

Add skeleton loading screens (`loading.tsx`) to all 7 public DB-backed routes, providing instant visual feedback while MongoDB queries resolve.

---

## Why

Next.js App Router automatically renders `loading.tsx` as a React Suspense fallback while the page's async Server Component fetches data. Without it, users see a blank page during MongoDB round-trips. Co-located `loading.tsx` files are zero-overhead — they are static Server Components with no client-side JS.

---

## Approach

- **CSS technique**: GPU-composited shimmer via `transform: translateX()` on `::after` pseudo-element. This is the only correct approach — `background-position` shimmer triggers CPU paint per frame, causing jank on low-end mobile.
- **Plain `.skeleton` class** (not `@utility`): TailwindCSS 4 `@utility` blocks cannot contain `::after` pseudo-elements, so a regular CSS class is required.
- **Shimmer gradient exception**: The "no gradients" rule applies to UI design (buttons, cards, backgrounds). The shimmer animation uses a `linear-gradient` on an `::after` pseudo-element as a pure animation technique — explicitly approved.
- **Co-located files**: Each route gets its own `loading.tsx`. No shared skeleton component to avoid import coupling and keep files independently editable.
- **Semantic string keys**: `key={\`sk-card-${i}\`}` pattern — never array index.

---

## CSS Changes — globals.css

### 1. Add skeleton CSS variables to `:root` (first block, lines 5-10)

```css
:root {
  --animate-slide: 0.8s;
  --animate-fade: 0.5s;
  --animate-float: 3s;
  --animate-ease: ease-out;
  --sk-base: #e2e8f0;
  --sk-shine: rgba(255, 255, 255, 0.65);
}
```

### 2. Add dark-mode override after `:root` block

```css
.dark {
  --sk-base: #334155;
  --sk-shine: rgba(255, 255, 255, 0.10);
}
```

### 3. Add `.skeleton` class + keyframes after `.no-scrollbar` section

```css
@keyframes skeleton-shimmer {
  0%   { transform: translateX(-200%); }
  100% { transform: translateX(200%);  }
}
.skeleton {
  position: relative;
  overflow: hidden;
  background-color: var(--sk-base);
}
.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 20%, var(--sk-shine) 50%, transparent 80%);
  transform: translateX(-200%);
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}
```

---

## 7 loading.tsx Files

| Route | Grid | Cards | Image Area |
|---|---|---|---|
| `/portfolio` | `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` | 8 | `h-56 skeleton` |
| `/gallery` | `sm:grid-cols-2 lg:grid-cols-3` | 6 | `aspect-[16/10] skeleton` full-bleed |
| `/resources` | `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` | 8 | `relative aspect-video overflow-hidden shrink-0 skeleton` (gotcha fix) |
| `/portfolio/[id]` | `lg:grid-cols-4` sidebar layout | hero + related | `aspect-video skeleton` |
| `/gallery/[id]` | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` | 8 | `h-60 skeleton` |
| `/resources/[id]` | `lg:grid-cols-4` sidebar layout | content only | `aspect-video skeleton` |
| `/games` | `max-w-2xl` search + 2 category groups | 6 total | `rounded-[2.5rem]` cards |

### Known Gotcha — aspect-video inside flex-col

`aspect-video w-full` inside a `flex flex-col` container collapses to 0 height.

**Wrong:**
```jsx
<div className="flex flex-col">
  <div className="aspect-video w-full skeleton" />  {/* collapses! */}
</div>
```

**Correct:**
```jsx
<div className="flex flex-col">
  <div className="relative aspect-video overflow-hidden shrink-0 skeleton" />
</div>
```

---

## Impact Analysis

- **Performance**: Zero JS added. All `loading.tsx` files are pure static Server Components.
- **Memory/CPU**: CSS animation uses `transform` (GPU-composited) — no CPU paint per frame.
- **Bundle size**: No new imports or client components.
- **UX**: Immediate visual feedback on navigation to any DB-backed route.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `aspect-video` collapse in flex | Low (known) | Visual bug | Apply gotcha fix from AGENTS.md |
| Dark mode variables not cascading | Low | Wrong colors | `.dark` on `<html>` — CSS vars cascade to all children ✓ |
| Shimmer breaks on older Safari | Very low | No animation | `transform` is universally supported since Safari 9 |

---

## Files

### Modified
- `src/app/globals.css`
- `package.json`
- `changelog.md`

### Created
- `.agents/plans/skeleton-loading.md` (this file)
- `src/app/(website)/portfolio/loading.tsx`
- `src/app/(website)/gallery/loading.tsx`
- `src/app/(website)/resources/loading.tsx`
- `src/app/(website)/portfolio/[id]/loading.tsx`
- `src/app/(website)/gallery/[id]/loading.tsx`
- `src/app/(website)/resources/[id]/loading.tsx`
- `src/app/(website)/games/loading.tsx`
- `.agents/report/report-Apr_21_2026-*.md`
