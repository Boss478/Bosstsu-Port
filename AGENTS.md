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

Read `.agents/memory.md` for bugs, errors, and context from previous sessions (condensed version table).
Full post-mortems are in the Obsidian vault (`boss-project/` subfolder).

### 4. Read Obsidian Vault

Read `/Users/boss123/obsidian-vault/` for additional notes and references.

> **Tip:** Run `/start-session` or `task -> "run triage agent"` to automate this (reads all state in one call).

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

## Database Rules (CRITICAL)

> **Violating these rules will cause permanent data loss. Read every time.**

1. **ADD/EDIT/REMOVE data in database: ASK USER FIRST** — no exceptions. Tell them exactly which collections, what data, and the impact.
2. **REMOVE PERMISSION IS DENIED** — never execute `deleteMany()`, `findByIdAndDelete()`, or any destructive DB operation without explicit user confirmation.
3. **Tell the user EVERYTHING** before touching the database: what collections, what data fields, how many documents will be affected, and any side effects.
4. **Seed scripts must NEVER use `deleteMany` without user approval.** Prefer individually inserting/updating.
5. **Previous incident:** seed script's `deleteMany({})` wiped user-created gallery data. This MUST NEVER happen again.

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

## Context Budget Rules

> **Preserve context quality.** Enforce these when context pressure builds.

- **Compress after every completed task** — before moving to next item
- **Subagent for exploration >3 tool calls** — offload research to keep main window clean
- **Monitor tokenscope at natural breakpoints** — know your budget
- **If context feels full: stop, compress, then continue**

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
- **Thai font clipping (Font จม)**: Thai descenders (ภ ว ม ห ฤ ร) need more line-height than Latin. Use `leading-relaxed` or `leading-normal` for Thai text at 2xl+. Avoid `bg-clip-text` + `text-transparent` on Thai text (clips at em-box). Avoid `leading-tight`/`leading-snug` near Thai. When editing any Thai text heading, always check `bg-clip-text`, line-height, and `overflow-hidden` parents.

---

## Custom Agents (opencode)

Four project-specific agents in `~/.config/opencode/agent/`:

| Agent    | Permission                 | Purpose                                             |
| -------- | -------------------------- | --------------------------------------------------- |
| **TRIAGE**  | bash + read (no edit)      | Session start: read memory, plans, changelog, vault |
| **DEPLOY**  | bash + read                | Docker build, VPS deploy, health check, rollback    |
| **VERIFY**  | bash + read (no edit)      | Pre-done gate: build, lint, version/changelog match |
| **DOC**     | edit `.agents/**`, changelog | Reports, memory, Obsidian vault persistence         |

Usage: `task -> "run triage agent"` (or use `/start-session` command)

---

## Custom Commands (opencode)

Three custom commands in `~/.config/opencode/command/`:

| Command              | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| `/start-session`     | Ensure dev server + run triage agent (all-in-one)        |
| `/session-status`    | Show git status, dev server, changelog, memory, plans    |
| `/task-done`         | Run completion protocol: build, bump, changelog, report  |

Usage: type `/command-name` in the TUI prompt.

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

## MCP Tools

- Use `context7` to look up documentation for Next.js, React, TailwindCSS, MongoDB
- Use `gh_grep` to search code examples on GitHub when unsure about implementation patterns

---

## Reference Docs

| Doc                     | File                                  |
| ----------------------- | ------------------------------------  |
| Styling & Glassmorphism | `.agents/reference/glassmorphism.md`    |
| Deployment & Docker     | `.agents/reference/deployment.md`       |
| Error Codes             | `.agents/reference/error-codes.md`      |
| Error Patterns           | `.agents/reference/error-patterns.md`    |
| Workflow & Guidelines   | `.agents/reference/workflow.md`         |
| Full Project Structure  | `.agents/reference/project-structure.md`|
