# Rule: Errors & Patterns

Source: @ .agents/reference/error-codes.md + error-patterns.md (merged 2026-08-22)

## Error Codes

All error codes centralized in `src/lib/error-code.ts` (single flat structure).

### HTTP Codes

400, 401, 403, 404, 413, 415, 422, 429, 500, 502, 503

### App Codes

| Code | Range | Description |
|------|-------|-------------|
| `U01`-`U05` | Upload | File size, type, folder, cover |
| `A01`-`A02` | Auth | Invalid password, rate limited |
| `DB01`-`DB03` | Database | Create, update, delete |
| `T01`-`T03` | Tag | Empty, add failed, not found |
| `P01`-`P02` | Pyodide | Invalid request, invalid input |

### Usage

```typescript
import { getError, createErrorResponse } from '@/lib/error-code';

getError('404')    // HTTP error → { code: "ERROR_404 [404]", httpStatus: 404, ... }
getError('U01')    // App error → { code: "ERROR_U01 [413]", httpStatus: 413, ... }
```

### Response Format

```json
{
  "code": "ERROR_404 [404]",
  "httpStatus": 404,
  "message": "ไม่พบข้อมูล",
  "translation": "Not Found"
}
```

---

## Error Pattern Reference

> Living document — catalog of bugs, gotchas, and root causes by category.
> Add new patterns as discovered. Cross-ref with Obsidian vault post-mortems.

---

### Recurring Bug Classes (Watch for These)

#### 1. Step config vs session config resolution (4+ instances)
- **Symptom**: Step-specific settings silently ignored; API/component reads `session.config` instead of `steps[n].config`
- **Root Cause**: Multi-step sessions store per-step config in `steps[n].config` — downstream code often only checks `session.config`
- **Fix**: Always compute effective config: `{ ...session.config, ...steps[n]?.config }`
- **Files**: `respond/route.ts`, `poll/route.ts`, `ResultsView.tsx`, multi-step components
- **First seen**: v1.9.x — recurring in 4+ post-mortems

#### 2. BETA gate graduation oversight (2+ instances)
- **Symptom**: Feature works on `/beta` route but not in production
- **Root Cause**: `isBeta` boolean prop gates components/code paths; graduation never completed
- **Fix**: Remove `isBeta` guard when promoting; verify production path works end-to-end
- **Files**: `GameOverlays.tsx`, `MenuScreen.tsx`, various beta components
- **First seen**: v1.9.44 — recurring

#### 3. FormData field extraction gaps (2+ instances)
- **Symptom**: A FormData field passes through the request but is never read by the handler
- **Root Cause**: `formData.get('fieldName')` not called; field silently ignored
- **Fix**: Explicitly `.get()` every form field; validate with Zod `.strict()` to catch extras
- **Files**: `respond/route.ts`, `edit/route.ts`, all API routes
- **First seen**: v1.9.x

#### 4. Docker / environment config drift (2+ instances)
- **Symptom**: Feature works locally but fails in Docker/production
- **Root Cause**: New env vars not added to `docker-compose.yml` services; `NODE_ENV` leaks; MongoDB unreachable during build
- **Fix**: When adding env-dependent features, always update `docker-compose.yml`; wrap ISR DB calls in try-catch
- **Files**: `docker-compose.yml`, `package.json`, ISR pages
- **First seen**: v1.9.x

#### 5. Dead code accumulation (2+ instances)
- **Symptom**: Unused files, exports, CSS rules accumulate post-refactor
- **Root Cause**: No periodic dead-code scanning in workflow
- **Fix**: Run knip quarterly; check for orphaned exports when refactoring
- **First seen**: v1.9.x

#### 6. Save ordering — file before DB (2+ instances)
- **Symptom**: Orphaned uploaded files when DB write fails
- **Root Cause**: File-first save: upload files → inject URLs → DB write. If DB fails, files are orphaned.
- **Fix**: 3-phase save: save text draft → upload files → atomic `saveMedia*` write with published flag
- **Files**: All 4 admin form + action files
- **First seen**: v1.9.x

---

### TailwindCSS Gotchas

#### duration-XXX not a valid utility
- **Symptom**: CSS transition plays at 150ms (default) instead of intended duration
- **Root Cause**: Tailwind default duration values: 75/100/150/200/300/500/700/1000. `duration-600` etc silently ignored
- **Fix**: Use `duration-[600ms]` (arbitrary value syntax)
- **Files**: Any file with `transition-transform duration-XXX`
- **Post-mortem**: `2026-06-08_04-48_Card_Obtain_Animation_Fix_PostMortem.md`

#### aspect-video + flex column → 0 height
- **Symptom**: Aspect-ratio elements collapse to 0px in flex column
- **Root Cause**: Tailwind aspect-ratio can't compute with flex column constraints
- **Fix**: Use `h-48 sm:h-56 shrink-0` or `min-h-[Npx]` instead of `aspect-video w-full` in `flex-col`
- **Files**: Any flex column with aspect-video child
- **Post-mortem**: AGENTS.md Known Gotchas

#### `@theme` only in globals.css — no tailwind.config.ts
- **Symptom**: Attempting to create `tailwind.config.ts` will be silently ignored
- **Root Cause**: TailwindCSS 4 uses `@theme` in CSS only
- **Fix**: Add custom values via `@theme { --custom-name: value; }` in globals.css
- **Files**: `src/app/globals.css`
- **Post-mortem**: AGENTS.md Known Gotchas

#### CSS utility defined but no `@utility`
- **Symptom**: Animation/fade class used in components but keyframes never defined
- **Root Cause**: Class used without corresponding `@utility` or `@keyframes` in CSS
- **Fix**: Always define `@keyframes` + `@utility` in globals.css before using in components
- **Files**: `src/app/globals.css`
- **Post-mortem**: Dead Code Cleanup Round 2

---

### React Gotchas

#### First-obtain card flip + sparkle particles
- **Symptom**: No distinct celebration for first-time card collection
- **Root Cause**: `isNew` flag passed through pipeline but only produced small "NEW!" badge
- **Fix**: Different heading ("New Card Collected!"), bigger badge, 12 sparkle particles
- **Files**: `CardRevealModal.tsx`
- **Post-mortem**: `2026-06-08_04-48_Card_Obtain_Animation_Fix_PostMortem.md`

#### Card animation race condition — finishGame vs cardReveal
- **Symptom**: CardRevealModal appears for ~500ms then immediately replaced by victory screen
- **Root Cause**: `finishGame` setTimeout (1500ms) vs card reveal setTimeout (1000ms) — only 500ms window
- **Fix**: Defer `finishGame` via `pendingFinishRef` until user taps KEEP on CardRevealModal
- **Files**: `useGameActions.ts`
- **Post-mortem**: `2026-06-08_06-42_Card_Reveal_Race_Condition_PostMortem.md`

#### Conditional hooks after early return
- **Symptom**: "Rendered fewer hooks than expected" error
- **Root Cause**: `useCallback`/`useEffect` placed after a conditional early return
- **Fix**: Move all hooks before any early return — hooks must always run in same order
- **Files**: `MultiStepSessionView.tsx`
- **Post-mortem**: MultiStepSessionView Hook Bug / v1.9.x

#### `redirect()` inside Server Action with `useActionState`
- **Symptom**: Login redirect fails silently or partially
- **Root Cause**: `redirect()` + `Set-Cookie` + 303 combination not reliably handled by React client router
- **Fix**: Return `{ success: true }` from Server Action, navigate via `useRouter.push()` in `useEffect`
- **Files**: `src/app/boss478/login/actions.ts` + `page.tsx`
- **Post-mortem**: Login Redirect Failure

---

### MongoDB / Database Gotchas

#### `bufferCommands: false` — hard fail on unready connection
- **Symptom**: Query throws immediately instead of queueing
- **Root Cause**: `bufferCommands: false` prevents Mongoose from silently buffering
- **Fix**: Always `await dbConnect()` before any query
- **Files**: `src/lib/db.ts`, all API routes and Server Actions
- **Post-mortem**: AGENTS.md Architecture Notes

#### Pool capped at 3 — avoid heavy ops
- **Symptom**: Slow queries under concurrent load
- **Root Cause**: VPS RAM constraint — pool cannot exceed 3
- **Fix**: Use `.lean()` for read-only, index frequently queried fields, batch writes
- **Files**: All model queries
- **Post-mortem**: AGENTS.md Resource & Scaling

---

### TypeScript Gotchas

#### `serializeDoc<T>` breaks `as` casts
- **Symptom**: Type error on `as SomeType` after serializing a Mongoose doc
- **Root Cause**: Generic mapped type `SerializedDoc<T>` doesn't produce exact shape downstream
- **Fix**: Use `as unknown as T` bridge internally
- **Files**: `src/lib/db.ts`
- **Post-mortem**: Phase 4 Build Fixes

#### `as const` + `.includes()` type rejection
- **Symptom**: `.includes()` on `as const` array rejects valid values
- **Root Cause**: `as const` creates readonly tuple; `.includes()` expects exact member type
- **Fix**: Explicit `string[]` type annotation on the array
- **Files**: API route files
- **Post-mortem**: Finance Tracker TS Build Errors

---

### Security Gotchas

#### XSS via `dangerouslySetInnerHTML`
- **Symptom**: User output rendered unsanitized
- **Root Cause**: Python compiler renders output via `dangerouslySetInnerHTML` without HTML escaping
- **Fix**: `escapeHtml()` at call sites (not inside `appendOutput()` — would double-escape)
- **Files**: `PythonCompilerClient.tsx`
- **Post-mortem**: XSS & Timing-Attack Security Fixes

#### Timing attack in password comparison
- **Symptom**: Password comparison leaks timing information
- **Root Cause**: `!==` operator short-circuits on first differing character
- **Fix**: Use `crypto.timingSafeEqual` with null/NFC normalization guard
- **Files**: `src/app/admin/login/actions.ts`
- **Post-mortem**: XSS & Timing-Attack Security Fixes

---

### Infrastructure Gotchas

#### Missing env vars in docker-compose.yml
- **Symptom**: Feature works locally but not in Docker
- **Root Cause**: New env vars added to `.env` but not passed to container services
- **Fix**: When adding env-dependent features, add the var to both `app` and `app-dev` services in `docker-compose.yml`
- **Files**: `docker-compose.yml`
- **Post-mortem**: Missing PRIVATE Env Vars

#### Stale .next cache blocking build
- **Symptom**: Build fails with mysterious ACL errors or stale chunks
- **Root Cause**: macOS ACL on `.next/` prevents cache invalidation
- **Fix**: `chmod -a` remove ACL + clear `.next` cache
- **Files**: No code change — environment fix
- **Post-mortem**: Stale .next Cache With ACL

#### Duplicate JSON keys in package.json
- **Symptom**: Dependencies silently erased
- **Root Cause**: Duplicate `devDependencies` key in `package.json`
- **Fix**: Merge duplicate keys; not caught by CI
- **Files**: `package.json`
- **Post-mortem**: Docker Build Failure

---

### Flaticon Gotchas

#### Invalid icon class names render as blank
- **Symptom**: Icon renders as empty space
- **Root Cause**: Guessed class names don't exist in Solid Rounded CSS
- **Fix**: Verify class names against Flaticon reference before using
- **Files**: Any file with `fi fi-sr-*` icons
- **Post-mortem**: Missing Flaticon Icon Classes

#### Subset font — only 117 of 1000+ icons used
- **Symptom**: 314KB woff2 page weight
- **Root Cause**: Full Flaticon font loaded; only ~11% of icons used
- **Fix**: Subset via pyftsubset; 314KB → 9.2KB (97% reduction)
- **Files**: `src/app/flaticon-subset.css`
- **Post-mortem**: Flaticon Font 314KB Bottleneck

---

### Thai Text Gotchas

#### Font clipping on descenders
- **Symptom**: Thai descenders (ภ ว ม ห ฤ ร) clipped at em-box boundary
- **Root Cause**: `bg-clip-text` + `text-transparent` clips content box; `leading-tight`/`leading-snug` too tight for Thai glyphs
- **Fix**: Avoid `bg-clip-text` + `text-transparent` on Thai text; use `leading-relaxed` or `leading-normal` for Thai at 2xl+
- **Files**: Any page with Thai headings
- **Post-mortem**: AGENTS.md Known Gotchas

---

### Admin / CMS Gotchas

#### File-first save → orphaned files on DB failure
- **Symptom**: Uploaded files with no DB record after failed save
- **Root Cause**: Upload files → inject URLs → DB write. DB failure leaves orphaned files.
- **Fix**: 3-phase: save text draft → upload → atomic `saveMedia*`
- **Files**: All 4 admin form + action files
- **Post-mortem**: DB-First Save Flow, Image Upload Overhaul

---

### Build & CI Gotchas

#### Build needs MONGODB_URI
- **Symptom**: Build fails in CI without MongoDB
- **Root Cause**: ISR pages call `dbConnect()` during static generation
- **Fix**: GitHub Actions needs MongoDB service container; wrap ISR DB calls in try-catch
- **Files**: CI config, ISR pages
- **Post-mortem**: Docker Build Failure

#### `npm run analyze` not `ANALYZE=true npm run build`
- **Symptom**: Env var not picked up in build
- **Root Cause**: AI-style env prefix doesn't work — must use npm script
- **Fix**: Use `npm run analyze` (defined in package.json) instead of direct env var prefix
- **Files**: `package.json`
- **Post-mortem**: Memory block

---

## Reference

- Post-mortems: `/Users/boss123/obsidian-vault/boss-project/`
- Memory block: `.agents/memory.md`
- Project conventions: `AGENTS.md`
