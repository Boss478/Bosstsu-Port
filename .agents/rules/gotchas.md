# Rule: Gotchas

Source: @ AGENTS.md Known Gotchas

## Known Gotchas

- `aspect-video` + flex col → height 0. Use `h-48 shrink-0` or `min-h-[Npx]`
- `suppressHydrationWarning` on `<html>` required (ThemeProvider sets `.dark` first render)
- `bufferCommands: false` → queries hard-fail on unready connections
- `sharp` in `serverExternalPackages` (can't run edge)
- Thai descenders (ภ ว ม ห ฤ ร) at 2xl+: avoid `bg-clip-text`, `leading-tight`; use `leading-relaxed`
- Next.js 16 ESLint `react-hooks/immutability` (no ref.current in render) + `react-hooks/set-state-in-effect` (no setState in effect body) → lazy `useState(() => ...)` for localStorage in client-only trees
- Hydration mismatch localStorage: `useState(() => localStorage.getItem(...))` in SSR tree diverges → use `'use client'` shell via `next/dynamic(..., { ssr: false })` (see `*Shell.tsx`); `ssr:false` not allowed in Server Components with `metadata`; else `startTransition(() => setState(...))` in effect
- Node 24 LTS — `engines` >=24.15.0, `.nvmrc` 24, runtime `/opt/homebrew/opt/node@24/bin` (add to PATH, default shell node may differ)
- `pool: 3` — do not raise for RAM budget; `bufferCommands: false` needs ready connection guards.
