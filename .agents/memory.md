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
- **Glassmorphism** — all transparent elements MUST have backdrop-blur:
  - Filter buttons: `bg-white/40 backdrop-blur-xs`
  - Cards/forms: `bg-white/60 backdrop-blur-sm`
  - Navbar: `bg-white/40 backdrop-blur-3xs`
- Centralized configs in `src/lib/`:
  - `config.ts` — main CONFIG (auth, upload, image, pagination, rate limit)
  - `error-code.ts` — unified HTTP + app error codes (flat structure)
  - `constants.ts` — DB timeouts, animation, routes

### Critical Gotchas

| Issue | Fix |
|-------|-----|
| `aspect-video w-full` inside flex column collapses to 0 height | Use explicit heights (`h-48 sm:h-56 shrink-0`) or `min-h-[Npx]` |
| `suppressHydrationWarning` required on `<html>` | ThemeProvider sets `.dark` on first render, causes mismatch |
| `bufferCommands: false` in Mongoose | Queries hard-fail if DB unready — don't catch/ignore the error |
| `sharp` in `serverExternalPackages` | Cannot run in edge runtime |

### Glassmorphism Patterns

| Opacity | Light | Dark | Blur | Usage |
|--------|-------|------|------|-------|
| 40% | `bg-white/40` | `bg-slate-800/40` | `backdrop-blur-xs` | Filter buttons |
| 40% | `bg-white/40` | `bg-slate-900/40` | `backdrop-blur-3xs` | Navbar |
| 60% | `bg-white/60` | `bg-slate-800/60` | `backdrop-blur-sm` | Cards, forms |
| Borders: `border-white/60` / `border-slate-700/50` |
| Shadows: `shadow-lg shadow-sky-100/40` / `shadow-black/20` |
| Always use both opacity + blur together |
| See AGENTS.md "Glassmorphism Design" for full docs |

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
- Latest changelog: `v1.5.11` (2026-04-18)
- All versions synced: `package.json`, `package-lock.json`, `changelog.md` all at `1.5.11`

### New Centralized Files (v1.5.11)

| File | Purpose |
|------|---------|
| `src/lib/error-code.ts` | Unified HTTP + app error codes (flat structure) |
| `src/lib/constants.ts` | DB timeouts, pool, animation durations, routes |

### Error Code System

- Single file `src/lib/error-code.ts` — HTTP (400, 401, 404...) + App codes (U01-U05, A01-A02, DB01-DB03, T01-T03, P01-P02)
- Usage: `getError('404')` or `getError('U01')` — single key lookup
- Format: `ERROR_404 [404]: message (translation)` or `ERROR_U01 [413]: message (translation)`
- Returns: `{ code, httpStatus, message, translation }`

### Refactoring Notes

- DB settings now in `src/lib/constants.ts` — `DB.TIMEOUTS`, `DB.POOL`
- Mongo Express URL uses `process.env.MONGO_EXPRESS_URL`
- Animation timings via CSS vars: `--animate-slide`, `--animate-fade`, `--animate-float`

### Notes

- Review this file at every session start
- Add entries after any user correction or discovered issue

---

## Session: 2026-04-19

### Admin: New Resource Page Enhancement (v1.5.15)

**Added 8 resource types:**
- Article (HTML Editor + image/video/link/PDF support)
- Presentation (Canva Embed / PDF embed + file upload)
- Video (YouTube URL)
- Lesson Plan (PDF upload only)
- Sheet (JPG/PNG/PDF upload)
- Worksheet (JPG/PNG/PDF upload)
- Scratch (embed code)
- Interactive (embed code)

**Subject options now Thai (English):**
- คณิตศาสตร์ (Mathematics), วิทยาศาสตร์ (Science), ภาษาไทย (Thai), ประวัติศาสตร์ (History), เทคโนโลยี (Technology), ศิลปะ (Art), สังคมศึกษา (Social Studies), อื่น ๆ (Other)

**New Learning schema fields:**
- content (HTML for Article)
- embedCode (iframe for Scratch/Interactive)
- fileUrl (uploaded file)
- youtubeId (Video)
- canvaEmbed (Presentation)

**Validation:**
- Type-specific file validation (strict MIME types)
- DOMPurify sanitization at write-time
- Extended Zod schemas with per-type validation

**Dependencies:**
- react-quill removed (not React 19 compatible) → replaced with custom `RichTextEditor` using `contentEditable` + `document.execCommand`
- react-pdf + pdfjs-dist added (in deps, not yet used in UI)

### RichTextEditor Pattern (v1.5.16)

- Font size: use `execCommand('fontSize', false, '7')` then immediately query `font[size="7"]` and replace with `<span style="font-size: Npx">` — always use value "7" as the marker
- Save/restore selection for link/image dialogs: `window.getSelection()`, `getRangeAt(0).cloneRange()`, `sel.removeAllRanges()`, `sel.addRange(savedRange)`
- Active format tracking: call `document.queryCommandState(cmd)` on `onKeyUp` + `onMouseUp` of the editor div
- `OpenPanel` discriminated union pattern (not multiple boolean flags) for toolbar dropdowns
- `ToolbarDivider` must be defined OUTSIDE the parent component to avoid remount on every render

### Resource Detail Page Pattern (v1.5.18)

- Learning resources use MongoDB `_id.toString()` as URL param — no slug — validate with `mongoose.isValidObjectId(id)` before any DB query
- `.lean()` returns POJO — define local lean types (`LeanLearningDoc`, `LeanNavDoc`, `LeanRecentDoc`) instead of casting to the Mongoose Document interface
- Prev/Next navigation by `createdAt`: older = `{ createdAt: { $lt: docDate } }` sort desc limit 1, newer = `{ createdAt: { $gt: docDate } }` sort asc limit 1
- `hasPrimaryContent()` helper function keeps the fallback external-link logic clean — checks if any type-specific content field is populated
- **`@tailwindcss/typography` is NOT installed** — use `.article-content` class in `globals.css` for rich-text HTML rendering (covers h1–h6, p, ul/ol, a, blockquote, code/pre, dark mode)