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
| `npm run eval` | Run eval harness (pass feature: `npm run eval -- auth`) |

---

## Eval Harness

Eval definitions at `.agents/evals/*.md`. Run with `npm run eval` for full suite or feature-specific commands. Results written to `.agents/report/eval-*.md`.

### Eval Types
- **Capability**: Feature-specific behavior tests (code graders)
- **Regression**: Baseline checks against frozen schemas/routes (pass^3 = 1.00 for release-critical)

### Creating a New Eval
1. Define in `.agents/evals/<feature>.md` using template from `.agents/evals/auth.md`
2. Add baseline assertion in `.agents/evals/baseline.json`
3. Add run function in `.agents/evals/run-evals.sh`

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

## MCP Conventions

- **Obsidian vault:** Use `obsidian-mcp` tools (`search_notes`, `read_note`, `create_note`) — never raw file reads
- **Fallback:** `external_directory` permission only when MCP is unavailable

---

## Skills & Subagents

Skills are in `~/.opencode/skills/` (user-level, loaded each session). Archived skills at `.agents/archived-skills/` (load manually when needed). Reference repo at `~/.opencode/agent-skills/`.

### Wave 1 — Core (always available)
| Skill | Directory | Use When |
|---|---|---|
| spec-driven-development | `spec-dev` | Writing a PRD before implementing a new feature |
| planning-and-task-breakdown | `plan-task` | Breaking a plan into task units (complements `boss478-plan`) |
| incremental-implementation | `implement-task` | Building a thin vertical slice |
| test-driven-development | `test-driven-development` | Writing tests first (Red-Green-Refactor) |
| code-review-and-quality | `review` | 5-axis code review before merging |
| shipping-and-launch | `ship` | Pre-launch checklist, staged rollouts |

### Wave 2 — Extended (load when needed)
| Skill | Directory | Use When |
|---|---|---|
| doubt-driven-development | `doubt-driven-development` | High-stakes decisions (production, security, irreversible) |
| source-driven-development | `source-driven-development` | Grounding framework decisions in official docs |
| code-simplification | `code-simplification` | Reducing complexity while preserving behavior |
| security-and-hardening | `security-and-hardening` | User input, auth, data storage, external integrations |
| frontend-ui-engineering | `frontend-ui-engineering` | Component architecture, responsive design, a11y |
| browser-testing-with-devtools | `browser-test` | DevTools inspection for runtime data |
| debugging-and-error-recovery | `debug` | Complementing `debug-mantra` for structured triage |
| context-engineering | `context` | Context packing, MCP integration patterns |
| git-workflow-and-versioning | `git-workflow-and-versioning` | Atomic commits, conventional commit messages |
| documentation-and-adrs | `docs-adr` | Writing ADRs, documenting the *why* |
| ci-cd-and-automation | `ci-cd-and-automation` | Quality gate pipelines, Shift Left |
| performance-optimization | *(merged into `web-performance`)* | Measure-first + backend anti-patterns |

### Subagents (project `opencode.json`)
| Agent | Role | Skills Used | Tools |
|---|---|---|---|
| `spec-writer` | PRD/spec creation | `spec-dev` | read, glob, grep, write, edit |
| `builder` | Incremental implementation | `implement-task` + `test-driven-development` | + npm build/test/lint/dev |
| `test-engineer` | TDD and test writing | `test-driven-development` | + npm test/run |
| `simplifier` | Code simplification | `code-simplification` | read, glob, grep, write, edit |
| `webperf-auditor` | Performance audit | `web-performance` | + npx lighthouse |

---

## Prompt Efficiency

- **Prefer `question` with preset options** for cacheable prompts
- **Batch related edits** to maintain cache continuity
- **Verify agnostic** — run `npm run build` (not just lint)
