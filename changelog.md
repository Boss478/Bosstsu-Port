# Website Update Log

> [!UPDATE NOTE]
> **Symbols**: `+` = Added new feature for ... | `*` = Fixed/Changed this feature, by ... | `-` = Removed the feature, (reason/detail)

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
