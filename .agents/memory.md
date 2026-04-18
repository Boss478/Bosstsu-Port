# Memory — Boss478

Store important bugs, errors, mistakes, and project context from previous sessions.

---

## Project Knowledge

### Architecture
- Next.js 16 with App Router
- TailwindCSS 4 (no `tailwind.config.ts`) — all custom tokens in `@theme {}` in `globals.css`
- MongoDB with Mongoose — pool capped at **3**, `bufferCommands: false`
- Local fonts in `src/fonts/` loaded via `next/font/local` — **never Google Fonts**
- Flaticon icons (`fi fi-sr-*`) — **no emoji as icons**
- Class-based dark mode via `ThemeProvider` (`.dark` class on `<html>`)

### Critical Gotchas

| Issue | Fix |
|-------|-----|
| `aspect-video w-full` inside flex column collapses to 0 height | Use explicit heights (`h-48 sm:h-56 shrink-0`) or `min-h-[Npx]` |
| `suppressHydrationWarning` required on `<html>` | ThemeProvider sets `.dark` on first render, causes mismatch |
| `bufferCommands: false` in Mongoose | Queries hard-fail if DB unready — don't catch/ignore the error |
| `sharp` in `serverExternalPackages` | Cannot run in edge runtime |

### React Patterns (from changelog)

- **Ref during render error**: Never assign refs inside render body — use `useEffect`
- **Textarea ref**: Don't access ref during render — use state + `useEffect`
- **Type safety**: No `any` casts — create interfaces in `src/types/global.d.ts`
- **Sanitization**: Run `DOMPurify.sanitize()` at **write-time**, not read-time

### MongoDB Patterns

- **Case-insensitive tag matching**: Use `$expr` + `$toLower` instead of RegExp
- **Related items**: Use `find` + JS scoring instead of `$aggregate`
- **Pagination queries**: Use `skip/limit` with MongoDB indexes, exclude heavy fields (`content`, `gallery`) with projections

### Admin Security

- JWT cookie auth via `verifyAuth()` + Zod `.strict()` on all Server Actions
- Rate limiting: 5 attempts / 15 min, then 15-minute lockout
- Error messages: generic Thai only — never leak stack traces (log full details server-side)

---

## Session: 2026-04-18

### Current State
- Latest changelog: `v1.5.10` (2026-04-18)
- All versions synced: `package.json`, `package-lock.json`, `changelog.md` all at `1.5.10`

### Notes

- Review this file at every session start
- Add entries after any user correction or discovered issue