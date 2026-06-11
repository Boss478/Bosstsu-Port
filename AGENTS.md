---
description: Boss478 Personal Portfolio Website
---

# AGENTS.md — Boss478 Portfolio

Single source of truth for AI agents.

---

## Project Overview

Next.js 16 (App Router), TailwindCSS 4 (`@theme`, no config), MongoDB (Mongoose, pool: 3, `bufferCommands: false`), TypeScript (strict). Theme: React Context + localStorage + `.dark` on `<html>`. Fonts: Mali, Geist Sans/Mono (local files via `next/font/local`). Icons: Flaticon `<i className="fi fi-sr-*" />`.

Key paths: `(website)/` (public), `admin/` (CMS), `api/` (routes).

---

## Dev Commands

| Cmd | Purpose |
| --- | ------- |
| `npm run dev` | Dev server (port 3300, `--webpack`) |
| `npm run build` | Final verification |
| `npm run lint` | ESLint 9 flat config |
| `npm run seed` | Seed MongoDB via `scripts/seed.ts` |

---

## Database Rules (CRITICAL)

> Violating these causes permanent data loss.

1. **ADD/EDIT/REMOVE: ASK USER FIRST** — exact collections, data, impact
2. **Never deleteMany/findByIdAndDelete** without explicit confirmation
3. **Seeds: never use deleteMany without approval**
4. **Previous incident:** seed wipe of gallery data — MUST NEVER repeat

---

## Completion Protocol

1. `npm run build` — must pass clean
2. Ask before bumping version (minor patch default)
3. Update `changelog.md` (`+`/`*`/`-`)
4. `package.json` version must match latest changelog
5. Ask about post-mortem

---

## Versioning

Minor patch default. Major only when told. Always ask.

---

## Known Gotchas

- `aspect-video` + flex col → height 0. Use `h-48 shrink-0` or `min-h-[Npx]`
- `suppressHydrationWarning` on `<html>`: required (ThemeProvider sets `.dark` on first render)
- `bufferCommands: false` → queries hard-fail on unready connections
- `sharp` in `serverExternalPackages` (can't run edge)
- Thai descenders (ภ ว ม ห ฤ ร) at 2xl+: avoid `bg-clip-text`, `leading-tight`; use `leading-relaxed`

---

## Resource

KVM1 VPS (1 vCPU, 4GB RAM). DB pool: 3 (do not raise). Rate limit: 5 logins/15min. Concurrency: 50-100.

---

## File Conventions

- Artifacts under `.agents/` (never `~/.opencode/`)
- Plans → `.agents/plans/` | Reports → `.agents/report/` | Memory → `.agents/memory.md` | Tasks → `.agents/tasks/todo.md`

---

## Prompt Efficiency

- **Prefer `question` with preset options** for cacheable prompts
- **Batch related edits** to maintain cache continuity
- **Verify agnostic** — run `npm run build` (not just lint)
