---
description: Boss478 Personal Portfolio Website
---

# AGENTS.md — Boss478 Portfolio

Single source of truth for AI agents.

---

## Session Start

1. Ensure dev server: `curl -s http://localhost:3300 2>/dev/null || (npm run dev & disown && sleep 5)`
2. Check `.agents/plans/` and `.agents/report/` for current tasks
3. Read `.agents/memory.md` for bugs/errors from previous sessions
4. Read `/Users/boss123/obsidian-vault/` for notes/references
5. Or run `/start-session` to automate all above

---

## Project Overview

Portfolio — Next.js 16 (App Router), TailwindCSS 4 (`@theme`, no config), MongoDB (Mongoose, pool: 3, `bufferCommands: false`), TypeScript (strict). Theme: React Context + localStorage + `.dark` on `<html>`. Fonts: Mali, Geist Sans/Mono (local files only via `next/font/local`). Icons: Flaticon `<i className="fi fi-sr-*" />`.

Key paths: `(website)/` (public), `admin/` (CMS), `api/` (routes). See `.agents/reference/project-structure.md`.

---

## Dev Commands

| Cmd | Purpose |
| --- | ------- |
| `npm run dev` | Dev server (port 3300, `--webpack` — not `next dev` directly) |
| `npm run build` | Final verification |
| `npm run lint` | ESLint 9 flat config (`eslint.config.mjs`) |
| `npm run seed` | Seed MongoDB via `scripts/seed.ts` |
| `docker compose exec app-dev npm run build` | Quick build check via Docker |

---

## Core Principles

- Simplicity first: minimal code impact per change
- Root causes only: no temporary fixes
- Clean code: expressive names over comments; no debug artifacts
- Error safety: generic Thai messages to clients, full logs server-side

---

## Database Rules (CRITICAL)

> Violating these causes permanent data loss. Read every time.

1. **ADD/EDIT/REMOVE data: ASK USER FIRST** — exact collections, data, impact
2. **Never execute deleteMany() / findByIdAndDelete()** without explicit confirmation
3. **Tell user everything** before DB ops: collections, fields, doc count, side effects
4. **Seeds: never use deleteMany without approval.** Prefer individual inserts/updates
5. **Previous incident:** seed wipe of gallery data — MUST NEVER repeat

---

## Completion Protocol (no exceptions)

1. `npm run build` — must pass clean
2. Ask before bumping version (minor patch default)
3. Update `changelog.md` (`+` / `*` / `-` bullets)
4. `package.json` version must match latest `changelog.md` entry
5. Ask about post-mortem (→ `boss478-post-mortem` skill)
6. Output summary: what changed, version, changelog updated

---

## Context Budget

- Compress after every completed task
- Subagent for exploration >3 tool calls
- Monitor tokenscope at natural breakpoints
- If full: stop, compress, continue

---

## Versioning

Minor patch default (`1.1.1` → `1.1.2`). Major (`1.1.x` → `1.2.0`) only when told. Always ask. See `changelog.md`.

---

## Architecture

- **Public:** `(website)/` with Navbar+Footer layout
- **Admin:** `admin/` — JWT middleware (`/admin/:path*`), verifyAuth() + Zod .strict()
- **DB:** Mongoose singleton, pool 3, `bufferCommands: false`
- **Uploads:** 30mb body limit, `sharp` in `serverExternalPackages` (never edge)
- **CSP:** `unsafe-inline`/`unsafe-eval` by design (React Compiler)
- **Middleware:** `/admin/:path*` only — zero public route overhead

---

## Knowledge Persistence

All entries to Obsidian vault (`/Users/boss123/obsidian-vault/`):
- `boss-project/` for project (always + `.agents/memory.md`)
- `coding/` for patterns/bugs/fixes | `learn/` for concepts | `references/` for research | `notes/` for rest
- One file per topic. Naming: `DATE_TIME_{TASK_NAME}.md`. Include date+time at top. Use `[[wikilink]]` to cross-link.

---

## Known Gotchas

- `aspect-video` + flex col → height 0. Use `h-48 shrink-0` or `min-h-[Npx]`
- `suppressHydrationWarning` on `<html>`: required (ThemeProvider sets `.dark` on first render)
- `bufferCommands: false` → queries hard-fail on unready connections
- `sharp` in `serverExternalPackages` (can't run edge)
- No `tailwind.config.ts` — TailwindCSS 4 uses `@theme` in `globals.css`
- Thai descenders (ภ ว ม ห ฤ ร) at 2xl+: avoid `bg-clip-text`, `leading-tight`; use `leading-relaxed`

---

## Custom Agents & Commands

| Agent | Permission | Purpose |
| ----- | ---------- | ------- |
| TRIAGE | bash+read | Read memory, plans, changelog, vault |
| DEPLOY | bash+read | Docker build, deploy, health check |
| VERIFY | bash+read | Pre-done gate: build, lint, version check |
| DOC | edit .agents/**, changelog | Reports, memory, vault persistence |

| Command | Purpose |
| ------- | ------- |
| `/start-session` | Dev server + triage agent |
| `/session-status` | Git, server, changelog, memory, plans |
| `/task-done` | Build → bump → changelog → report |

---

## Resource

KVM1 VPS (1 vCPU, 4GB RAM). DB pool: 3 (do not raise). Rate limit: 5 logins/15min. Concurrency: 50-100.

---

## File Conventions

- Artifacts under `.agents/` (never `~/.opencode/`)
- Plans → `.agents/plans/{name}.md` | Reports → `.agents/report/` | Memory → `.agents/memory.md` | Tasks → `.agents/tasks/todo.md`
- Plan first, verify before implementing, mark as you go

---

## Prompt Efficiency (Token Budget)

- **Prefer `question` with preset options** — the `question` tool with defined options produces more cacheable prompts than open-ended questions. Always offer choices when asking.
- **Batch related edits** — consolidate multiple edits into fewer tool calls to maintain cache continuity between calls.
- **Verify agnostic** — run `npm run build` (not just `npm run lint`). Build catches what lint misses.

---

## MCP

- `context7` → Next.js, React, TailwindCSS, MongoDB docs
- `gh_grep` → GitHub code examples for implementation patterns

---

## Reference Docs

| Doc | File |
| --- | ---- |
| Styling & Glassmorphism | `.agents/reference/glassmorphism.md` |
| Deployment & Docker | `.agents/reference/deployment.md` |
| Error Codes | `.agents/reference/error-codes.md` |
| Error Patterns | `.agents/reference/error-patterns.md` |
| Workflow & Guidelines | `.agents/reference/workflow.md` |
| Project Structure | `.agents/reference/project-structure.md` |
