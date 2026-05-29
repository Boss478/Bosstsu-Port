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
curl -s http://localhost:3300 2>/dev/null || (
  npm run dev &
  disown && sleep 5
)
```

If port 3300 is in use, leave it — do NOT switch to another port. Wait for it to free up.

### 2. Review project state

Check current task and plan files in `.agents/plans/` and `.agents/report/` if available.

### 3. Check memory

Read `.agents/memory.md` to recall important bugs, errors, mistakes, and project context from previous sessions.

### 4. Read Obsidian Vault

Read `/Users/boss123/obsidian-vault/` to check for additional context, notes, references, and project-related knowledge that may inform the current task.

---

## Project Overview

เว็บไซต์ portfolio ส่วนตัวสำหรับเก็บผลงาน กิจกรรม รูปภาพ สื่อการเรียนรู้ และเกมการศึกษา

**Tech Stack:**
- **Framework:** Next.js 16 (App Router)
- **Styling:** TailwindCSS 4 (`@theme` in `globals.css` — no `tailwind.config.ts`)
- **Theme:** Custom React Context `<ThemeProvider>` (localStorage + class toggle)
- **Database:** MongoDB (Mongoose)
- **Language:** TypeScript (strict)
- **Fonts:** Mali (Thai), Geist Sans/Mono (English) — **local files only**

---

## Project Structure

```
boss478/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (fonts, metadata)
│   │   ├── (website)/              # Public site route group
│   │   │   ├── layout.tsx          # Website layout with Navbar/Footer
│   │   │   ├── page.tsx            # Home (Hero + section cards)
│   │   │   ├── portfolio/          # ผลงาน + กิจกรรม (+ [id] detail)
│   │   │   ├── gallery/            # รูปภาพ (+ [id] album detail)
│   │   │   ├── resources/          # สื่อการเรียนรู้ (+ python-compiler subpage)
│   │   │   └── games/              # เกมการศึกษา
│   │   ├── admin/                  # Admin CMS (protected by middleware)
│   │   │   ├── login/
│   │   │   ├── layout.tsx          # Admin layout with sidebar
│   │   │   ├── portfolio/          # CRUD for portfolio items
│   │   │   ├── gallery/            # CRUD for gallery albums
│   │   │   ├── learning/           # CRUD for learning resources
│   │   │   └── games/              # CRUD for games
│   │   └── api/                    # API routes (upload, pyodide-input, process-words)
│   ├── components/
│   │   ├── Header.tsx              # Navbar (fixed, glass backdrop)
│   │   ├── Footer.tsx
│   │   ├── ThemeProvider.tsx       # Dark/light theme context
│   │   └── admin/                  # Admin-specific components
│   ├── lib/
│   │   ├── db.ts                   # MongoDB connection (cached, pool: 3)
│   │   ├── auth.ts                 # JWT token validation
│   │   ├── config.ts               # App configuration constants
│   │   ├── upload.ts               # Upload handling utilities
│   │   ├── error-code.ts           # Unified HTTP + app error codes
│   │   └── constants.ts             # DB timeouts, animation, routes
│   ├── models/                     # Mongoose schemas
│   ├── middleware.ts               # Admin route protection (JWT cookie)
│   └── types/
├── scripts/                        # Utility scripts (seed.ts)
├── public/                         # Static assets + uploads
├── docker-compose.yml
└── dockerfile
```

**Key URLs (dev):** `http://localhost:3300`
- `/` Home · `/portfolio` · `/gallery` · `/resources` · `/games`
- `/admin` (protected)

---

## Dev Commands

```bash
npm run dev      # Uses --webpack (baked into the script — do NOT run next dev directly)
npm run lint     # ESLint 9 flat config (eslint.config.mjs)
npm run seed     # Seed MongoDB via scripts/seed.ts (tsx)
```

**Use `npm run dev` for development. Run `npm run build` only as final verification before marking a task done.**

---

## Mandatory on Every Task Completion

> **No exceptions.**

1. **Run `npm run build`** — verify build passes before marking done (no errors, no warnings)
2. **Bump `package.json` `"version"`** — minor patch by default; major only when explicitly told (**ask user before bumping**)
3. **Add a matching entry to `changelog.md`** using `+` / `*` / `-` bullets
4. **`package.json` version and latest `changelog.md` entry must match exactly**
5. **Ask about post-mortem** — Ask the user if they want a post-mortem report. If yes, invoke the `boss478-post-mortem` skill which handles the report (`.agents/report/`), project memory (`.agents/memory.md`), and Obsidian vault persistence.
6. **Output a completion summary** — what changed, current version, changelog updated?

---

## Knowledge Persistence Mapping

Where to persist knowledge after each task:

| Topic                                    | Target Folder                                                |
| ---------------------------------------- | ------------------------------------------------------------ |
| This project (Boss478 Portfolio)         | `boss-project/` (always, in addition to `.agents/memory.md`) |
| Important coding patterns / bugs / fixes | `coding/`                                                    |
| Concepts / techniques learned            | `learn/`                                                     |
| Research / things searched               | `references/`                                                |
| Everything else                          | `notes/`                                                     |

**Topic separation:** When writing to Obsidian vault, split knowledge across multiple `.md` files — one per topic. Do not bundle unrelated topics into a single file. Place each file in the appropriate subfolder (`boss-project/`, `coding/`, `learn/`, `references/`, `notes/`).

**File naming convention for `boss-project/`:** `DATE_TIME_{TASK_NAME}` (e.g., `2026-05-13_14-30_Fix_Admin_Game_Edit_Validation.md`) — other folders use any reasonable naming.

**Note:** Always include date and time (e.g., `2026-05-13 14:30`) at the top of new Obsidian Vault entries.

**Linking:** After creating a new report in Obsidian Vault (`boss-project/`), add internal links to related existing notes:
  - Link to `2026-05-13_00-00_Project_Knowledge.md` if it's a general project update
  - Link to relevant pattern files (e.g., `2026-05-13_00-00_RichTextEditor_Pattern.md`) if the new task relates to that pattern
  - Use Obsidian `[[wikilink]]` syntax for internal links

---

## Versioning & Changelog

**Versioning rules:**
- Minor patch (default): `1.1.1` → `1.1.2`
- Major bump: `1.1.x` → `1.2.0` — only when explicitly instructed
- **Always ask user before bumping version** — do not auto-bump without confirmation

**Changelog format:**
```
## vX.Y.Z (YYYY-MM-DD)
+ Added new feature for ...
* Fixed/Changed ... by ... (short detail)
- Removed ..., reason: ...
```

Every changelog must keep an `UPDATE NOTE` block at the top explaining the symbol structure.

---

## Styling — TailwindCSS 4

- **No `tailwind.config.ts`** — all custom tokens go inside `@theme {}` in `src/app/globals.css`
- Import syntax: `@import "tailwindcss"` (not the v3 `@tailwind base/components/utilities`)
- Custom utilities registered with `@utility` blocks (not a plugin)
- Dark mode is **class-based** via `ThemeProvider` putting `.dark` on `<html>`:
  ```css
  @custom-variant dark (&:where(.dark, .dark *));
  ```
  `dark:` utilities do **not** respond to `prefers-color-scheme` — the class must be present.
- **No gradients anywhere** — solid/flat colors only (enforced project rule)

---

## Glassmorphism Design

The project uses glassmorphism (frosted glass effect) for floating UI elements. All glass components MUST include both transparency AND backdrop blur.

### Core CSS (.glass class in globals.css:144-149)
```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(1px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

### Tailwind Patterns — Opacity + Blur Reference

| Opacity | Light Mode | Dark Mode | Blur Level | Usage |
|---------|-----------|-----------|------------|-------|
| 40% | `bg-white/40` | `bg-slate-800/40` | `backdrop-blur-xs` | Filter buttons, badges |
| 40% | `bg-white/40` | `bg-slate-900/40` | `backdrop-blur-3xs` | Navbar |
| 60% | `bg-white/60` | `bg-slate-800/60` | `backdrop-blur-sm` | Cards, forms, containers |
| 80% | `bg-white/80` | `bg-slate-900/80` | `backdrop-blur-md` | Overlays, modals |

### Standard Pattern — Always Use Both

```
bg-white/60 dark:bg-slate-800/60 + backdrop-blur-sm + border + shadow
```

### Border + Shadow (Always Required for Glassmorphism)

| Element | Light Mode | Dark Mode |
|---------|-----------|----------|
| Border | `border-white/60` | `border-slate-700/50` |
| Shadow | `shadow-lg shadow-sky-100/40` | `shadow-black/20` |

### Blur Levels (globals.css @theme)

| Class | Value |
|-------|-------|
| `backdrop-blur-3xs` | 1.5px |
| `backdrop-blur-xs` | 0.5px |
| `backdrop-blur-sm` | 4px |
| `backdrop-blur-md` | 8px |

### Quick Reference — Component Patterns

| Component | Classes |
|-----------|---------|
| **Navbar** | `bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xs border shadow-lg` |
| **Dropdown** | `bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border shadow-xl` |
| **Card** | `bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border shadow-sm` |
| **Filter Button** | `bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border` |
| **Form Container** | `bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border shadow-sm` |

### Rule: Never Use Transparency Without Blur

Every glassmorphism element MUST have both:
- ✓ Opacity (e.g., `bg-white/60`)
- ✓ Blur (e.g., `backdrop-blur-sm`)

Wrong: `bg-white/60` without blur
Correct: `bg-white/60 backdrop-blur-sm`

---

## Icons & Fonts

- **No emoji as icons** — use Flaticon only: `<i className="fi fi-sr-*" />`
- Flaticon CSS imported in `src/app/layout.tsx` from `@flaticon/flaticon-uicons` npm package
- **Fonts are local files** in `src/fonts/` loaded via `next/font/local` — **never `next/font/google`**
- Font CSS vars: `--font-geist-sans`, `--font-geist-mono`, `--font-mali`

---

## Architecture Notes

| Area | Fact |
|---|---|
| Route group | Public site under `src/app/(website)/` with its own `layout.tsx` (Navbar + Footer) |
| Admin | `src/app/admin/` — protected by `src/middleware.ts` (JWT cookie, `/admin/:path*` only) |
| Auth | All admin Server Actions must call `verifyAuth()` + Zod `.strict()` — no exceptions |
| DB | Mongoose singleton in `src/lib/db.ts`; pool capped at **3** (VPS limit — do not raise); `bufferCommands: false` means unready connections hard-fail immediately |
| Uploads | Server actions body limit `30mb`; `sharp` in `serverExternalPackages` — never move to edge |
| CSP | `unsafe-inline`/`unsafe-eval` in `next.config.ts` is **intentional** (React Compiler requirement) |
| Middleware | Scoped to `/admin/:path*` only — zero overhead on public routes |

---

## Error Code System

All error codes centralized in `src/lib/error-code.ts` (single flat structure).

- **HTTP Codes**: 400, 401, 403, 404, 413, 415, 422, 429, 500, 502, 503
- **App Codes**:
  - `U01`-`U05`: Upload errors (file size, type, folder, cover)
  - `A01`-`A02`: Auth errors (invalid password, rate limited)
  - `DB01`-`DB03`: Database errors (create, update, delete)
  - `T01`-`T03`: Tag errors (empty, add failed, not found)
  - `P01`-`P02`: Pyodide errors (invalid request, invalid input)

**Usage:**
```typescript
import { getError, createErrorResponse } from '@/lib/error-code';

getError('404')    // HTTP error → { code: "ERROR_404 [404]", httpStatus: 404, ... }
getError('U01')    // App error → { code: "ERROR_U01 [413]", httpStatus: 413, ... }
```

**Response format:**
```json
{
  "code": "ERROR_404 [404]",
  "httpStatus": 404,
  "message": "ไม่พบข้อมูล",
  "translation": "Not Found"
}
```

---

## React Compiler

`babel-plugin-react-compiler` is enabled. Dev server uses `--webpack` because Turbopack doesn't support it. The compiler applies **automatic memoization** — avoid redundant manual `useMemo`/`useCallback` unless profiling shows a real need.

---

## React & State Management Guidelines

- **State**: Keep minimal — no duplicate or redundant state
  - **Derived data**: Compute with `useMemo`, don't store it
  - **`useEffect`**: Only for true side effects (API calls, subscriptions, DOM sync) — not for data transformation or computed values
  - **Re-renders**: No inline functions/objects as props — they create new references every render
  - **Components**: Split large components into focused logic + UI pieces
  - **Data flow**: Top-down, single source of truth
  - **Performance**: `useMemo` for expensive computations, `useCallback` for stable callbacks (note: React Compiler handles most of this automatically — profile before adding manual memos)
  - **Lists**: Always use stable, unique keys — never array index
  - **Architecture**: Separate concerns — custom hooks for logic, services for API, components for UI only

**Golden Rule:**
- If it can be calculated → don't store it
- If it's not a side effect → don't use `useEffect`

---

## MongoDB / Docker

- MongoDB and Mongo Express bound to `127.0.0.1` only — access via SSH tunnel or Tailscale:
  ```bash
  ssh -L 8081:localhost:8081 user@<tailscale-ip>
  # then open http://localhost:8081
  ```
- `docker-compose.yml` RAM limits: app `1024M`, mongo `1536M`, mongo-express `128M`
- Required env vars (see `.env.example`): `MONGODB_URI`, `ADMIN_PASSWORD`, `ADMIN_TOKEN_SECRET`, Mongo creds
- No CI pipeline — deployment is manual Docker on KVM1 VPS (1 vCPU, 4 GB RAM, 50 GB NVMe)

---

## Production Deployment (KVM1 VPS)

### First-Time Setup

```bash
# 1. SSH into VPS
ssh root@<vps-ip>

# 2. Install Docker + Compose
apt update && apt install -y docker.io docker-compose-v2

# 3. Clone repo
git clone https://github.com/Boss478/boss478.git /opt/boss478
cd /opt/boss478

# 4. Create uploads folder (required for bind mount - avoids 404 on static files)
mkdir -p uploads

# 5. Set up production env
cp .env.production .env
# EDIT .env — replace all CHANGE_ME_* values with strong passwords:
#   ADMIN_TOKEN_SECRET: openssl rand -hex 32
#   MONGO_INITDB_ROOT_PASSWORD: openssl rand -base64 32
#   ADMIN_PASSWORD: choose a strong password

# 5. Start services
docker compose --profile production up -d --build

# 6. Verify
curl http://localhost
docker compose ps
docker compose logs -f app

# 7. Seed database (optional)
docker compose exec app npx tsx scripts/seed.ts
```

### Update Commands

```bash
cd /opt/boss478
git pull
docker compose --profile production up -d --build app
```

### Backup (Optional)

```bash
# Run manually
bash scripts/backup.sh

# Or set up cron (daily at 3 AM):
crontab -e
# Add: 0 3 * * * /opt/boss478/scripts/backup.sh >> /var/log/backup.log 2>&1
```

### Enabling SSL (When Domain Ready)

1. Point your domain A record to VPS IP
2. Edit `Caddyfile` — replace `:80` with `yourdomain.com`
3. Edit `docker-compose.yml` — uncomment the `# - "443:443"` line
4. `docker compose up -d caddy`

Caddy will auto-provision Let's Encrypt certificates.

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible — minimal code impact
- **No Laziness**: Find root causes; no temporary fixes; senior-engineer standards
- **Self-Documenting Code**: Expressive variable and function names over comments
- **Clean Code**: Remove all debug/temporary comments after the work is done
- **Error safety**: Generic Thai-language messages to clients — never leak stack traces; log full details server-side only

---

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions).
- If something goes sideways, STOP and re-plan immediately — don't keep pushing.
- Write detailed specs upfront to reduce ambiguity.
- **Comprehensive Implementation Plans** must include:
  - **Version & Date**: Every plan must state the current project version and creation date at the top.
  - **Why & How**: Deep reasoning behind each decision with technical justification.
  - **Old Code vs New Code**: Exact original code and proposed replacement with full context.
  - **Impact Analysis**: Expected effects on performance, memory, CPU, bandwidth.
  - **System Constraints**: Performance, Network, Security, File structure, API usage.
  - **Risk Assessment**: What could go wrong, likelihood, impact, mitigation.
  - **Resource Impact**: Concrete numbers for memory, CPU cost, I/O overhead.
  - **Pre/Post Analysis**: Execution time, query count, Big O changes, memory/storage estimates.
  - **Security**: Attack surface, auth gaps, injection risks, data exposure.
  - **Requirements & Inventory**: All files to modify/create/remove, libraries/APIs, new imports, function signatures, new variables/constants/env vars.

### 2. Subagent Strategy
- Use subagents liberally to keep the main context window clean.
- Offload research, exploration, and parallel analysis to subagents.
- One task per subagent for focused execution.

### 3. Self-Improvement Loop
- After ANY correction from the user: update `.agents/memory.md` with the pattern.
- Write rules that prevent the same mistake recurring.
- Review `.agents/memory.md` at session start for relevant context.

### 4. Verification Before Done
- Never mark a task complete without proving it works.
- Diff behavior between main and your changes when relevant.
- Ask: "Would a staff engineer approve this?"
- **Run `npm run build` as final verification** — build must pass with no errors before marking done.

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: implement the elegant solution instead.
- Skip this for simple, obvious fixes — don't over-engineer.

### 6. Autonomous Bug Fixing
- When given a bug report: fix it. Don't ask for hand-holding.
- Point at logs, errors, failing tests — then resolve them.
- Go fix failing issues without being told how.

---

## Task Management

1. Write plan to `.agents/tasks/todo.md` with checkable items
2. Verify plan before starting implementation
3. Mark items complete as you go
4. Run `npm run build` — must pass before marking done
5. Bump version + update changelog before marking done (**ask user before bumping**)
6. **Ask about post-mortem** — Ask the user if they want a post-mortem report. If yes, invoke the `boss478-post-mortem` skill which handles report, memory, and vault persistence.
7. After completing a plan, update its status inside the plan file as `Done` with Date & Time

---

## Resource & Scaling Constraints

KVM1 VPS runs **multiple services simultaneously** — resources are shared and strictly limited.

- **DB**: Optimize MongoDB queries; use indexes; pool hard-capped at 3
- **Memory/CPU**: Avoid heavy blocking ops or high-allocation processing in server functions
- **Network**: Minimize payloads, batch requests, compress assets
- **Security**: All admin routes use `verifyAuth()` + Zod `.strict()`; rate limiting on login (5 attempts / 15 min, Map-based)
- **Concurrency target**: 50–100 concurrent users while other services consume resources

---

## File & Plan Conventions

- **Always create a plan first** before any task — no exceptions
- **Plans** → `.agents/plans/{plan_name}.md` (must start with version + date; long, detailed, technical)
- **Reports** → `.agents/report/report-{Mon}_{Day}_{YYYY}-{HH}_{mm}.md`
- **Memory** → `.agents/memory.md` (store bugs, errors, mistakes, important context)
- **Task lists** → `.agents/tasks/todo.md`
- All project artifacts go under `.agents/` in project root — **not** `~/.claude/`

---

## Known Gotchas

- **Tailwind flex + `aspect-video`**: `aspect-video w-full` inside a flex column collapses to 0 height. Use explicit heights (`h-48 sm:h-56 shrink-0`) or `min-h-[Npx]` instead.
- **`suppressHydrationWarning` on `<html>`** is required — `ThemeProvider` sets `.dark` on first render, causing an inevitable hydration mismatch without it.
- **`bufferCommands: false`** in Mongoose — queries against an unready connection hard-fail immediately, not silently queue.
- **`sharp` must stay in `serverExternalPackages`** — it cannot run in the edge runtime.
- **No `tailwind.config.ts`** — do not create one; TailwindCSS 4 uses `@theme` in `globals.css` exclusively.

---

## Custom Agents (opencode)

Three Boss478-specific agents defined globally in `~/.config/opencode/agent/`. Invoke via Task tool when needed.

| Agent | File | Permission | Purpose |
|-------|------|-----------|---------|
| **DEPLOY** | `deploy.md` | bash + read | Docker build, VPS deploy, health check, rollback, backup, SSL |
| **VERIFY** | `verify.md` | bash + read (no edit) | Pre-done gate: build, lint, version/changelog match, post-mortem |
| **DOC** | `doc.md` | edit `.agents/**`, changelog | Reports, memory, Obsidian vault persistence |

### Usage

```
Invoke via Task tool: task -> "run deploy agent" or "run verify agent"
```

Each agent is standalone — call when needed for its specific phase.

---

## Website Update Log

See [changelog.md](./changelog.md) for complete version history.

## Docker Dev Environment (v1.9.3)

A Docker-based dev environment with hot reloading was added alongside the existing production Docker setup.

### Usage

```bash
# Dev — everything in Docker with hot reload
docker compose --profile dev up -d --build

# Production
docker compose --profile production up -d --build

# Local dev (unchanged)
npm run dev
```

### Architecture

- **`docker-compose.yml`** — `app` has `profiles: ["production"]`, `app-dev` has `profiles: ["dev"]` — each only starts with its respective profile
- **`dockerfile.dev`** single-stage dev Dockerfile — installs deps, runs `npm run dev`
- Source code is volume-mounted (`.:/app`) for hot reload
- Container `node_modules` and `.next` are isolated via anonymous volumes (never host's)
- Runs as root (no `user: "1001:1001"`) to avoid volume mount permission issues
- Connects to the same `mongo` and `mongo-express` services as production
- Both `app` and `app-dev` expose port 3300 — cannot run simultaneously (intentional)
