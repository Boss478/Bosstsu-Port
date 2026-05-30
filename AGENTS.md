---
description: Boss478 Personal Portfolio Website
---

# AGENTS.md — Boss478 Portfolio

Single source of truth for AI agents. Every section answers: "Would an agent miss this without help?"

---

## Session Start Protocol

**On every session start:**

### 1. Ensure the dev server is running

```bash
curl -s http://localhost:3300 2>/dev/null || (npm run dev & disown && sleep 5)
```

If port 3300 is in use, leave it — do NOT switch. Wait for it to free up.

### 2. Review project state

Check `.agents/plans/` and `.agents/report/` for current tasks.

### 3. Check memory

Read `.agents/memory.md` for bugs, errors, and context from previous sessions.

### 4. Read Obsidian Vault

Read `/Users/boss123/obsidian-vault/` for additional notes and references.

---

## Project Overview

Portfolio website — Next.js 16 (App Router), TailwindCSS 4 (`@theme`, no config file), MongoDB (Mongoose), TypeScript (strict). Theme via React Context (localStorage + class `.dark` on `<html>`). Fonts: Mali, Geist Sans/Mono (local files only).

Key paths: `src/app/(website)/` (public), `src/app/admin/` (CMS), `src/app/api/` (API routes). See [`.agents/reference/project-structure.md`] for full tree.

---

## Icons & Fonts

- Icons: Flaticon only — `<i className="fi fi-sr-*" />` (no emoji)
- Fonts: local files only (`src/fonts/` via `next/font/local` — never `next/font/google`)
- CSS vars: `--font-geist-sans`, `--font-geist-mono`, `--font-mali`

---

## Dev Commands

| Command       | Purpose                                                          |
| ------------- | ---------------------------------------------------------------- |
| `npm run dev`   | Dev server (port 3300, `--webpack` — do NOT run `next dev` directly) |
| `npm run build` | Final verification before marking done                           |
| `npm run lint`  | ESLint 9 flat config (`eslint.config.mjs`)                         |
| `npm run seed`  | Seed MongoDB via `scripts/seed.ts`                                 |

Quick build check via Docker: `docker compose exec app-dev npm run build`

---

## Core Principles

- **Simplicity First** — minimal code impact for every change
- **No Laziness** — find root causes, no temporary fixes
- **Clean Code** — expressive names over comments; remove debug artifacts
- **Error Safety** — generic Thai messages to clients, full logs server-side

---

## Mandatory on Every Task Completion

> **No exceptions.**

1. **Run `npm run build`** — must pass with no errors or warnings
2. **Bump `package.json` version** — minor patch by default; **ask user before bumping**
3. **Update `changelog.md`** with matching entry (`+` / `*` / `-` bullets)
4. **`package.json` version and latest `changelog.md` entry must match**
5. **Ask about post-mortem** — if yes, invoke `boss478-post-mortem` skill
6. **Output completion summary** — what changed, current version, changelog updated

---

## Versioning

- Minor patch (default): `1.1.1` → `1.1.2`
- Major bump: `1.1.x` → `1.2.0` (only when explicitly told)
- **Always ask user before bumping**
- See `changelog.md` for full version history

---

## Architecture Notes

| Area        | Fact                                                                         |
| ----------- | ---------------------------------------------------------------------------- |
| Route group | Public under `src/app/(website)/` with its own layout (Navbar + Footer)        |
| Admin       | `src/app/admin/` — protected by `middleware.ts` (JWT cookie, `/admin/:path*`)      |
| Auth        | All admin Server Actions must call `verifyAuth()` + Zod `.strict()`              |
| DB          | Mongoose singleton in `src/lib/db.ts`; pool capped at **3**; `bufferCommands: false` |
| Uploads     | 30mb body limit; `sharp` in `serverExternalPackages` (never edge)                |
| CSP         | `unsafe-inline`/`unsafe-eval` intentional (React Compiler requirement)           |
| Middleware  | `/admin/:path*` only — zero overhead on public routes                          |

---

## Knowledge Persistence

| Topic                            | Target Folder                                            |
| -------------------------------- | -------------------------------------------------------- |
| This project (Boss478 Portfolio) | `boss-project/` (always, in addition to `.agents/memory.md`) |
| Coding patterns / bugs / fixes   | `coding/`                                                  |
| Concepts / techniques learned    | `learn/`                                                   |
| Research / things searched       | `references/`                                              |
| Everything else                  | `notes/`                                                   |

**Rules:** One file per topic. `boss-project/` naming: `DATE_TIME_{TASK_NAME}.md`. Include date+time at top of every entry. Use `[[wikilink]]` to link related notes.

---

## Known Gotchas

- **`aspect-video` + flex column**: collapses to 0 height. Use `h-48 sm:h-56 shrink-0` or `min-h-[Npx]`.
- **`suppressHydrationWarning` on `<html>`**: required — ThemeProvider sets `.dark` on first render.
- **`bufferCommands: false`**: queries hard-fail on unready connections (no silent queue).
- **`sharp` must stay in `serverExternalPackages`**: cannot run in edge runtime.
- **No `tailwind.config.ts`**: TailwindCSS 4 uses `@theme` in `globals.css` exclusively.

---

## Custom Agents (opencode)

Three project-specific agents in `~/.config/opencode/agent/`:

| Agent  | Permission                 | Purpose                                             |
| ------ | -------------------------- | --------------------------------------------------- |
| **DEPLOY** | bash + read                | Docker build, VPS deploy, health check, rollback    |
| **VERIFY** | bash + read (no edit)      | Pre-done gate: build, lint, version/changelog match |
| **DOC**    | edit `.agents/**`, changelog | Reports, memory, Obsidian vault persistence         |

Usage: `task -> "run deploy agent"` (standalone — call when needed)

---

## Resource & Scaling

KVM1 VPS runs multiple services (1 vCPU, 4GB RAM). DB pool: 3 (do not raise). Avoid heavy ops. Rate limiting: 5 login attempts / 15 min. Concurrency target: 50–100 users.

---

## File & Plan Conventions

- All artifacts under `.agents/` (never `~/.opencode/`)
- Plans → `.agents/plans/{name}.md` (start with version + date; long, detailed, technical)
- Reports → `.agents/report/` | Memory → `.agents/memory.md` | Tasks → `.agents/tasks/todo.md`
- Always create a plan first; verify before implementing; mark items as you go

---

## Reference Docs

| Doc                     | File                                  |
| ----------------------- | ------------------------------------  |
| Styling & Glassmorphism | `.agents/reference/glassmorphism.md`    |
| Deployment & Docker     | `.agents/reference/deployment.md`       |
| Error Codes             | `.agents/reference/error-codes.md`      |
| Workflow & Guidelines   | `.agents/reference/workflow.md`         |
| Full Project Structure  | `.agents/reference/project-structure.md`|
