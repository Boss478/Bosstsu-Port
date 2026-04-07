# Website Update Log

> [!UPDATE NOTE]
> **Symbols**: `+` = Added new feature for ... | `*` = Fixed/Changed this feature, by ... | `-` = Removed the feature, (reason/detail)

## v1.5.9 (2026-04-07)

* **Vulnerable Dependencies**: Updated Next.js (16.1.6 → 16.2.2+), isomorphic-dompurify, flatted, picomatch, undici, brace-expansion via `npm update` — resolved CSRF bypass, HTTP smuggling, prototype pollution, and ReDoS vulnerabilities. `npm audit` now shows 0 vulnerabilities.
* **CSP Documentation**: Added inline comment documenting why `unsafe-inline` and `unsafe-eval` are required in Content-Security-Policy (needed by `babel-plugin-react-compiler` dev builds).
* **Tag Query Simplified**: Replaced error-prone `RegExp` construction in `addCustomTag` with MongoDB `$expr` + `$toLower` for case-insensitive match — no regex escape logic needed, cleaner and safer.

## v1.5.8 (2026-04-07)

* **CSP Documentation**: Added inline comment documenting why `unsafe-inline` and `unsafe-eval` are required in Content-Security-Policy (needed by `babel-plugin-react-compiler` dev builds).
* **Tag Query Simplified**: Replaced error-prone `RegExp` construction in `addCustomTag` with MongoDB `$expr` + `$toLower` for case-insensitive match — no regex escape logic needed, cleaner and safer.
* **Mongo-Express Auth**: Enabled `ME_CONFIG_BASICAUTH=true` in `docker-compose.yml`, added `ME_CONFIG_BASICAUTH_USERNAME` and `ME_CONFIG_BASICAUTH_PASSWORD` environment variables. Mongo Express now requires credentials, preventing unauthenticated access.
* **Secure `.env.example`**: Replaced weak placeholder passwords (`password123`, `boss478admin`, `b0ss478-s3cr3t-k3y-ch4ng3-th1s`) with explicit `YOUR_*_HERE` placeholders to prevent accidental copy-paste of weak credentials.

## v1.5.6 (2026-04-07)

* **Portfolio Metadata**: Added metadata generation for portfolio pages and refactored pagination query handling.
* **Git Hygiene**: Updated `.gitignore` to include new project-specific and session memory paths (`.claude/`, `tasks/`, `.claude-servers.json`).

## v1.5.7 (2026-04-07)

+ **Login Rate Limiting**: Added Map-based brute force protection to admin login — 5 attempts per 15 minutes, then 15-minute lockout. Zero dependencies, < 3KB memory, lazy cleanup (no background threads).
+ **Pyodide API Hardening**: Added `verifyAuth()` guard to both GET and POST endpoints, capped `pendingInputs` Map at 50 entries with oldest eviction, added input validation (id ≤ 36 chars, value ≤ 1000 chars), reduced GET timeout from 30s to 15s.
* **Error Message Leakage**: Replaced raw `(error as Error).message` returns with generic Thai error messages across upload route, process-words route, and all admin CRUD action files (portfolio, gallery, games, resources). Full details logged server-side only.

## v1.5.5 (2026-04-07)

* **Centralized Upload/Image Settings**: Extracted all hardcoded upload and image processing values (`max_file_size`, `allowed_file_types`, `allowed_folders`, image quality, HEIC settings) into `lib/config.ts` for single-source management. Removed duplicated HEIC detection logic between `upload.ts` and `api/upload/route.ts` — consolidated into exported `isHeicFile()` helper.
* **Public Pages Pagination**: Replaced hardcoded `ITEMS_PER_PAGE = 15` in portfolio, gallery, and resources public pages with `CONFIG.PAGINATION.PORTFOLIO_PUBLIC`, `GALLERY_PUBLIC`, and `LEARNING_PUBLIC` for centralized control.
* **Config Comments**: Added inline comments explaining each setting's purpose and how to adjust for flexibility.

## v1.5.4 (2026-04-06)

* **Portfolio Detail Queries**: Reduced from 6 MongoDB queries to 3 — replaced `$aggregate` for related items with `find` + JS scoring, combined newer/older navigation into single `$or` query with projections.
* **Write-Time Content Sanitization**: Admin portfolio actions now run `DOMPurify.sanitize()` on `content` before saving to DB instead of sanitizing on every page view. Read path renders `dangerouslySetInnerHTML` directly without sanitization.

## v1.5.3 (2026-04-06)

+ **Server-Side Pagination**: Portfolio, Gallery, and Resources list pages now paginate on the server — `skip/limit` with MongoDB indexes instead of loading all data into the client.
* **Resources Page**: Added pagination controls (prev/next, page numbers) — previously had no pagination at all.
* **URL-Driven State**: All filter/sort/page state is now in URL search params, making pages shareable and bookmarkable. Client uses `useTransition` + `router.push` for navigation.
* **Field Projection**: DB queries now exclude heavy fields (`content`, `gallery` arrays, etc.) from list views to reduce payload size.

## v1.5.2 (2026-04-06)

* **MongoDB Indexes**: Added compound indexes on Gallery (`{ published: 1, date: -1 }` + `{ slug: 1, published: 1 }`) and Learning (`{ published: 1, createdAt: -1 }`) schemas for faster list and detail queries.
* **Lazy Loading**: Added `loading="lazy"` to all photo `<img>` elements in album detail page for faster initial render and reduced bandwidth.

## v1.5.1 (2026-04-06)

* **Number Game Stage 1**: Added sequential first-pass mode — for ranges ≤ 20 (1-10, 11-20, 1-20), numbers are now shown in order first to build familiarity, followed by a 5-number random review round before advancing to Stage 2.

## v1.5.0 (2026-04-06)

+ **Games Page Improvements**: Enhanced search to filter by title, description, and tags.
* **Fixed**: Games page MongoDB query now uses compound index (`published: { $eq: true }` instead of `$ne: false`), and ISR revalidate increased from 60s to 300s.
* **Fixed**: Number Game `startEndless()` — stage not reset to 1 when entering endless mode causing wrong progression.
* **Fixed**: Number Game stale `gameState` closures in `setTimeout` callbacks — added `useRef` for latest state reads.
* **Fixed**: SpellChecker infinite z-index — changed `z-100` to `z-50`.
* **Fixed**: SpellChecker `pickNextWord` reads stale `recentWordHistory` when called from inside `setWordStats` callback — added ref for latest values.
* **Fixed**: SpellChecker timer interval from 100ms to 1000ms (only displays whole seconds).
* **Fixed**: Alphabet & Number game `useCallback` dependencies were too broad (`[gameState]`, `[range, gameState]`), causing unnecessary re-creations — narrowed to `[]` with explicit param passing.
* **Fixed**: GamesClient violated "NO GRADIENTS" rule — replaced `bg-linear-to-t from-black/80 via-black/20 to-transparent` with `bg-black/60`, and `bg-linear-to-br from-sky-400 to-indigo-500` with `bg-sky-500`.
* **Fixed**: `GameItem` type mismatch between `data.ts` and `GamesClient.tsx` — unified interface imported from single source.
+ **Victory Screen**: Added "Back to Games" button on both Alphabet Adventure and Number Game victory screens.
* **Fixed**: Alphabet Adventure typing input had no focus indicator — added visible violet outline on focus.
* **Fixed**: SpellChecker Correct/Wrong popup — was anchored to the narrow card div so `left-1/2` was off-center; moved to the full-width flex container so it centers correctly over the game screen.

## v1.4.9 (2026-04-06)

+ **Game Immersion**: Both Alphabet Adventure and Number Game now automatically hide the site navbar and footer when entering the game screen, giving a fullscreen-like experience that fills the browser viewport. Nav/footer are restored on menu/victory screens and on page exit.

## v1.4.8 (2026-04-06)

* **Number Game UI Fix**: Moved fullscreen toggle from floating corner into the HUD bar next to score, matching Alphabet Adventure's layout.

## v1.4.7 (2026-04-06)

* **Alphabet Adventure UI Fix**: Centered the capital letter card by switching wrapper from `text-center` to `flex flex-col items-center`.
* **Alphabet Adventure UI Fix**: Moved fullscreen toggle button from floating absolute position into the HUD bar (next to score) for proper layout integration.

## v1.4.6 (2026-03-27)

+ **Contextual Autocomplete**: Suggestion menu now follows the typing cursor in real-time.
+ **Advanced Function Hints**: Metadata expanded to show educational vs. standard parameters based on the mode.
+ **Multi-Signature Logic**: Functions with complex usage like `range()`, `int()`, `pow()`, and `round()` now show distinct signatures on separate lines for better clarity.
+ **Contextual Logic Swap**: Adjusted parameter behavior (Full technical docs for Default/Easy, simplified for Study).
+ **Usage Examples**: Added inline code examples for built-in functions.
* **Refactor**: Moved "Learning" section to `/resources` for routing consistency.
* **Study Mode Refinement**: Fixed aggressive syntax highlights and false positive errors for user-defined symbols.
* **Localization**: Refined Thai descriptions for Study Mode parameters (e.g., `print(ข้อความ)`).

## v1.4.4 (2026-03-27)

* **Study Mode Adjustment**: Removed aggressive red variable error highlights (only unused-var and syntax/colon warnings remain).
- **Removed Execution History** section as part of UX simplification.
* **Fullscreen Upgrade**: Now hides site navbar and footer for a pure coding experience.

## v1.4.1 (2026-03-27)
* **Cleanup**: Removed redundant comments and simplified state in PythonCompilerClient.

  - `*` Upgraded Python Compiler to a professional educational tool with a 3-mode system:
    - **Default Mode**: Clean coding environment with basic syntax highlighting.
    - **Easy Mode**: Adds real-time Auto-complete suggestions (keywords/built-ins) and smart indentation.
    - **Study Mode**: Educational "Guardian" mode with auto-pairing, syntax detection (e.g., missing colons), unused variable warnings, and clickable console errors that jump to the editor line.
  - `+` Added Bilingual (Eng/Thai) Interactive Hover Tips and Parameter Hints for Python built-ins across all modes.
  - `+` Added Global Productivity Features: Execution History (last 10), Fullscreen Toggle, Shareable Base64 URLs, and File Download (.py/.txt).
  - `*` Optimized performance with 150ms debounced validation and 60fps typing experience.

- **v1.3.3**:

  - `*` Migrated from `next/font/google` to `next/font/local` by downloading raw `.ttf` and `.woff2` font files (Mali, Geist, Geist Mono) into `src/fonts/`, enabling fully offline development without first-boot internet dependencies.

- **v1.3.2**:
  - `*` Rewrote Python Compiler for true interactive inline console input (type directly in the console, like a real terminal).
  - `+` Added API route (`/api/pyodide-input`) for Web Worker input synchronization via sync XHR.
  - `-` Removed STDIN textarea and `window.prompt()` popup.
  - `*` Cleaned up all unnecessary code comments for self-documenting code.

- **v1.3.1**:
  - `*` Added Infinite Loop protection to the Python Compiler via a background `sys.settrace()` timeout analyzer, preventing browser crashes. The protection intelligently pauses while waiting for `input()`.

- **v1.3.0**:
  - `+` Added Online Python Compiler:
    - Pyodide WebAssembly for 100% client-side Python execution (0 server load).
    - Pre-built Python examples with Thai descriptions for students.
    - Interactive code editor with syntax indentation and line numbers.
    - Easy Mode for syntax highlighting and auto-indent algorithms.
    - Keyboard shortcuts (`Ctrl+Enter` to run).
- **v1.2.5**:
  - `*` Removed implicit fallback pseudo-secrets from `auth.ts`, strictly requiring `.env` presence for security.
  - `*` Secured mutating server actions (`createPortfolioItem`, etc.) with strict `verifyAuth` gateways and explicit Zod `.strict()` validation parsing to prevent NoSQL injection.
  - `*` Optimized public read pipelines (`getPortfolioItems`, `getGalleryAlbums`) with Next.js `unstable_cache` avoiding native DB hits to protect the VPS limits.
- **v1.2.4**:
  - `*` Increased the line height (`leading-snug`) on the detailed Portfolio page title for better readability.
- **v1.2.3**:
  - `+` Added Short Description as a TL;DR on the Portfolio detail page.
- **v1.2.2**:
  - `*` Added MongoDB health check to `docker-compose.yml` so the app waits for Mongo before starting; added `restart: unless-stopped` on all services; capped `mongo-express` at 128M RAM.
  - `+` Added `compress: true` to `next.config.ts` for gzip SSR responses.
  - `*` Narrowed middleware matcher from all pages to `/admin/:path*` only, eliminating no-op middleware overhead on public routes.
  - `*` Added `verifyAuth` guard to `/api/process-words` route to prevent unauthenticated CPU-intensive requests.
  - `*` Set `sharp.concurrency(1)` in `upload.ts` to prevent CPU starvation on concurrent image uploads.
  - `*` Reduced upload `MAX_SIZE` from 50MB to 30MB and Next.js body size limit from 60MB to 30MB.
  - `*` Reduced MongoDB `maxPoolSize` from 5 to 3 and added `connectTimeoutMS: 5000` in `db.ts`.
- **v1.2.1**:
  - `*` Redesigned cards on Main page and Portfolio page to feature a consistent glassmorphism aesthetic in both light and dark modes.
- **v1.2.0**:
  - `*` Deduplicated auth token validation — single `isValidToken` in `lib/auth.ts`, imported by both `middleware.ts` and `verifyAuth`.
  - `*` Consolidated duplicate security headers — removed from `middleware.ts` (kept in `next.config.ts` only), fixing conflicting `X-Frame-Options` and `frame-ancestors` values.
  - `-` Removed 11 unused files: default Next.js SVGs, empty `public/covers/`, orphaned CSVs, `GalleryGrid.tsx`, `src/data/venv/`, `Boss478 Head.png`.
  - `*` Moved `cheerio`, `csv-parse`, `csv-stringify` from dependencies to devDependencies (script-only, not runtime).
  - `*` Added `{ published: true }` filter to `getGalleryAlbums()` and `getPortfolioItems()` public queries.
  - `*` Added MongoDB connection pool limits (maxPoolSize: 5, minPoolSize: 1) and timeouts in `db.ts` for VPS resource constraints.
  - `*` Replaced sync `fs.readFileSync`/`fs.writeFileSync` with async `fs.promises` in `process-words/route.ts`.
  - `*` Reduced `next.config.ts` body size limit from 200MB to 60MB and added `output: 'standalone'`.
  - `*` Multi-stage production Dockerfile (node:20-alpine, ~200MB vs ~1.5GB) with Docker memory limits.
  - `*` Fixed mid-file import in `actions/portfolio.ts`.
  - `*` Fixed Mongoose duplicate slug index warnings in Gallery and Portfolio models.
  - `+` Added `/refactor` workflow at `.agents/workflows/refactor.md`.
- **v1.1.16**:
  - `*` Completely eliminated prop drilling in the Spellchecker game by migrating 18+ pieces of state and logic into a global `FlashcardContext`, significantly cleaning up the `Menu`, `Playing`, and `Result` component signatures for easier maintainability (Issues #8-#11).
- **v1.1.15**:
  - `*` Eliminated CPU layout thrashing by removing the global `* { transition }` wildcard from `globals.css` and removed non-compliant background gradient animations, significantly improving idle battery usage for mobile users.
- **v1.1.14**:
  - `*` Fixed blank screen flicker in Spellchecker when exiting games by delaying the data context destruction until after the out-animation completes.
  - `+` Appended dynamic website version tracking to the global site footer.
- **v1.1.13**:
  - `*` Fixed stale closures in the Spellchecker keyboard handler via refs to ensure accurate gameplay tracking.
  - `*` Fixed critical wipe swipe rendering lag (Issue #5) by removing rapid React state updates and replacing them with hardware-accelerated direct DOM `transform` manipulations, allowing 60fps tracking on mobile devices.
- **v1.1.12**:
  - `*` Fixed timer drift in SpellChecker by replacing chained `setTimeout` with a `Date.now()` synchronized interval, guaranteeing absolute accuracy over long play sessions.
- **v1.1.11**:
  - `*` Fixed duplicate words in SpellChecker for small datasets (Thai) by implementing a client-side 20-word History Buffer and improved CSV parsing with regex.
- **v1.1.10**:
  - `*` Updated `CLAUDE.md` with resource and scaling constraints, always considering 50-100 concurrent users and Hostinger VPS specs.
- **v1.1.9**:
  - `*` Consistent game renaming from "Is it spelled correctly?" to "SpellChecker" across database, metadata, and UI.
- **v1.1.8**:
  - `*` Fixed duplicate words in SpellChecker, by implementing a Fisher-Yates partial shuffle for 100% unique batch fetches without performance penalties.
- **v1.1.7**:
  - `*` Renamed SpellChecker game URL from `/games/is-it-spelled-correctly` to `/games/spellchecker` with permanent 308 redirect for existing bookmarks.
  - `*` Updated MongoDB migration scripts (`update-game-url.ts`, `check-game-url.ts`) to reference the new URL path.
- **v1.1.6**:
  - `*` Fixed memory leak in Endless mode, by implementing a 150-item rolling window array and decoupled data strategy for Result Screen history.
  - `+` Added new feature for live HUD Stopwatch in non-Timer game modes to track session elapsed time.
- **v1.1.5**:
  - `*` Fixed initial page load performance, by moving the 6.8k-word dataset to a Server Action with in-memory caching and dynamic client fetching ($O(V) \\to O(1)$).
- **v1.1.4**:
  - `*` Fixed CSV parsing for empty definitions, by handling empty strings to prevent displaying "false".
  - `*` Fixed Practice and Result screens, by hiding definitions for incorrectly spelled words.
  - `*` Fixed Mobile UI scrolling, by locking the game screen height and hiding Header/Footer.
- **v1.1.3**:
  - `+` Added new feature for Oxford dictionary scraping to enhance the 5000 word dataset with distinct parts-of-speech definitions and synonyms.
- **v1.1.2**:
  - `+` Added new feature for English Oxford 5000 word set for the game, complete with word class and CEFR level display.
- **v1.1.1**:
  - `*` Changed game core mechanics, by securing CSV data mapping, refining Practice vs Test modes, adding Life/Hardcore variations, and implementing end-game analytics.
