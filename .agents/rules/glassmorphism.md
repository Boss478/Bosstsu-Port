# Styling & Glassmorphism Reference

> Extracted from AGENTS.md — 2026-05-30

## TailwindCSS 4

- **No `tailwind.config.ts`** — all custom tokens go inside `@theme {}` in `src/app/globals.css`
- Import syntax: `@import "tailwindcss"` (not v3 `@tailwind base/components/utilities`)
- Custom utilities registered with `@utility` blocks (not a plugin)
- Dark mode is **class-based** via `ThemeProvider` putting `.dark` on `<html>`:
  ```css
  @custom-variant dark (&:where(.dark, .dark *));
  ```
  `dark:` utilities do **not** respond to `prefers-color-scheme` — the class must be present.
- **No gradients anywhere** — solid/flat colors only (enforced project rule)

## Glassmorphism Core CSS

`.glass` class in `globals.css:144-149`:
```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(1px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

## Tailwind Patterns — Opacity + Blur Reference

| Opacity | Light Mode | Dark Mode | Blur Level | Usage |
|---------|-----------|-----------|------------|-------|
| 40% | `bg-white/40` | `bg-slate-800/40` | `backdrop-blur-xs` | Filter buttons, badges |
| 40% | `bg-white/40` | `bg-slate-900/40` | `backdrop-blur-3xs` | Navbar |
| 60% | `bg-white/60` | `bg-slate-800/60` | `backdrop-blur-sm` | Cards, forms, containers |
| 80% | `bg-white/80` | `bg-slate-900/80` | `backdrop-blur-md` | Overlays, modals |

## Standard Pattern

```
bg-white/60 dark:bg-slate-800/60 + backdrop-blur-sm + border + shadow
```

## Border + Shadow

| Element | Light Mode | Dark Mode |
|---------|-----------|----------|
| Border | `border-white/60` | `border-slate-700/50` |
| Shadow | `shadow-lg shadow-sky-100/40` | `shadow-black/20` |

## Blur Levels (`globals.css` @theme)

| Class | Value |
|-------|-------|
| `backdrop-blur-3xs` | 1.5px |
| `backdrop-blur-xs` | 0.5px |
| `backdrop-blur-sm` | 4px |
| `backdrop-blur-md` | 8px |

## Component Quick Reference

| Component | Classes |
|-----------|---------|
| **Navbar** | `bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xs border shadow-lg` |
| **Dropdown** | `bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border shadow-xl` |
| **Card** | `bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border shadow-sm` |
| **Filter Button** | `bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border` |
| **Form Container** | `bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border shadow-sm` |

## Rule: Never Use Transparency Without Blur

Every glassmorphism element MUST have both:
- ✓ Opacity (e.g., `bg-white/60`)
- ✓ Blur (e.g., `backdrop-blur-sm`)

Wrong: `bg-white/60` without blur
Correct: `bg-white/60 backdrop-blur-sm`
