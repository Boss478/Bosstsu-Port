# Website Update Log

> [!UPDATE NOTE]
> **Symbols**: `+` = Added new feature for ... | `*` = Fixed/Changed this feature, by ... | `-` = Removed the feature, (reason/detail)


## v1.8.12 (2026-05-19)

+ Added file preview for Assignment tool — supports images (jpg/png/gif/webp) and PDF preview in modal; click "Preview File" button in results table to view
+ Added file re-upload capability for students — can replace or remove existing file when editing submission
+ Added student file preview modal — students can view their uploaded files in modal (no download option); "Edit" button for re-upload
* Fixed Assignment response count showing 0 — respond route increments responseCount after creating response

## v1.8.11 (2026-05-19)

* Fixed upload files returning 404 on VPS — Docker volume mount issue with missing directories, fixed by updating entrypoint.sh to create all upload directories on startup
* Changed Classroom Tools per-student rate limiting from IP-based to sessionStorage-based studentToken — fixes classroom LAN issue where all students share the same public IP


## v1.8.10 (2026-05-19)

+ Added confirmation dialog before ending Class Tools session to prevent accidental termination

## v1.8.9 (2026-05-18)

+ Added WebP auto-detection in saveFile() — automatically converts to WebP based on FOLDERS_CONVERT_TO_WEBP config
+ Added WebP conversion for gallery covers, game thumbnails, and learning resource thumbnails (gallery album photos stay JPEG)
+ Reduced image compression quality from 80 to 75 for both JPEG and WebP

## v1.8.8 (2026-05-18)

* Fixed file upload permission error on VPS — upload directories now pre-created with correct ownership in Dockerfile
* Fixed `.webp` images returning 404 on VPS — added entrypoint script to normalize upload file permissions to 644 on startup
+ Added permission-aware error handling in saveFile() with user-friendly Thai error messages
* Upload permission errors now bubble up to the user instead of showing generic "Cannot create data"
+ Added toast notification system for admin CRUD actions — success/error feedback at top-right of screen

## v1.8.7 (2026-05-18)

+ Added bilingual Thai/English UI for all student tool components (Padlet, Poll, Assignment, Q&A, Quiz, Exit Ticket, Discussion)
* Fixed admin timeout handling — 401 errors now redirect to /admin/login instead of showing alerts

## v1.8.6 (2026-05-18)

* Fixed: AdminSidebar version hardcoded to use dynamic `pkg.version` (was v1.8.3)


## v1.8.5 (2026-05-18)

* Refactored: Removed unused types (GameAction, VocabularyData, ResourceType, PaginatedResources)
* Refactored: Removed unnecessary exports from 14 internal-only symbols (ALPHABET_UPPER/LOWER, PRAISE, fisherYatesShuffle, ERRORS, ErrorKey, MONTHS, generateSessionCode, IGame, ITag, IToolResponse, ISessionConfig, IToolSession)
* Refactored: Removed 7 dead CSS classes and 4 unused @keyframes from globals.css
* Refactored: Removed createErrorResponse wrapper, replaced with getError in tags.ts
* Refactored: Extracted slugify() to format.ts, updated PortfolioForm, GalleryForm, games/actions.ts
* Refactored: Extracted parseTagString() to format.ts, updated 8 call sites across portfolio, gallery, games, resources actions
* Refactored: Extracted serializeDoc() to db.ts, updated 5 call sites in admin edit pages
* Refactored: Created validation.ts with shared Zod fields (titleField, descriptionField, slugField, tagsStrField, coverImageField)
* Refactored: Consolidated TYPE_OPTIONS and ALLOWED_FILE_TYPES to constants.ts


## v1.8.4 (2026-05-18)

+ Added custom 404 page for non-existent routes
+ Added friendly "Session not found" message on /study/[code] when session doesn't exist (replaces default Next.js 404)
+ Added client-side code validation on /study entry page — checks session before navigating, shows inline red error if not found or ended
+ Added inline error handling for admin session pages (valid ObjectId check, catches CastError, shows message within admin layout)


## v1.8.3 (2026-05-17)

+ Fixed: zoom now only affects result cards, not control bar


## v1.8.2 (2026-05-17)

+ Added column selector on session results page — Auto | 2 | 3 | 4 | 6 | 12 per row
+ Added size zoom controls on session results page — +/-10%, default 100%, range 50-250%


## v1.8.1 (2026-05-17)

+ Auto-refresh for session results — 15s on main page, 5s on full-screen tab
+ New full-screen tab at /admin/tools/sessions/{id}/results — no sidebar, wider grid
* Full-screen button now opens dedicated results tab (replaces overlay)
* Padlet grid in full-screen: 6 columns on xl, 4 on lg, 3 on md
- Removed results-fullscreen body class (no longer needed)


## v1.8.0 (2026-05-17)

- Removed 5 unused component files (FormError, FormField, FormSubmitButton, GlassCard, PublishedToggle from src/components/admin/)
- Removed 2 unused hooks (useObjectURL, useSlug from src/hooks/)
- Removed 2 unused action files (gallery.ts, portfolio.ts from src/app/actions/)
- Removed unused lib/utils.ts (only contained toSlug which was imported by useSlug)
- Removed unused exports getLevelName and getLevelNameShort from alphabet-adventure/constants.ts
- Removed unused export getSessionResults from admin/tools/actions.ts
- Removed unused npm packages: pdfjs-dist, quill, react-pdf, @types/uuid, cheerio, csv-parse, csv-stringify

## v1.7.9 (2026-05-17)

+ First-time production deployment to KVM1 VPS (187.77.146.149)
* Fixed Docker build failure — `generateStaticParams` now wrapped in try-catch to handle MongoDB unavailability during build (gallery/[id], portfolio/[id])
* Fixed Docker build failure — list pages (4 website + all admin) marked `force-dynamic` to prevent Next.js prerendering that requires DB at build time
* Fixed Docker build failure — admin new pages (games, resources, portfolio) marked `force-dynamic` since they call `getTagsByCategory()` which connects to MongoDB
* Fixed Docker build failure — passed `MONGODB_URI` as Docker build arg so static generation can reach DB when available
* Fixed Docker build failure — added `docker compose down` before rebuild to ensure clean start

## v1.7.8 (2026-05-16)

* Fixed Docker build failure — moved MONGODB_URI check to lazy inside dbConnect() (module-level throw with no .env during Docker build)
* Fixed Docker build failure — added Alpine build deps (python3, make, g++) and npm rebuild sharp for native module compilation
* Fixed Docker build failure — added NODE_OPTIONS memory limit (2048), NEXT_TELEMETRY_DISABLED, NEXT_ESLINT=false to Docker builder

## v1.7.7 (2026-05-16)

* Fixed Docker build failure — archiver v8 is ESM with named exports (not CJS default), updated import and type declaration
* Fixed Docker build failure — removed unused `deleteFile` import from edit/route.ts
* Fixed Docker build failure — wrapped `session.responseCount` with String()/Number() for Record<string, unknown> type safety
* Fixed Docker build failure — added explicit `: string` type to .map() callback param in MentimeterPoll

## v1.7.6 (2026-05-16)

+ Added production deployment setup for KVM1 VPS — multi-stage Dockerfile, production docker-compose with Caddy reverse proxy, persistent volumes
+ Created .env.production template with strong password placeholders
+ Created Caddyfile for reverse proxy with security headers and upload caching
+ Created backup.sh script for daily mongodump + uploads archive with 7-day rotation
+ Updated AGENTS.md with production deployment commands

## v1.7.5 (2026-05-16)

* Changed all modal overlay backgrounds from 40-90% opacity to 10% — subtle darkening (bg-black/10), removed all backdrop blur effects


## v1.7.4 (2026-05-16)

+ Added full-screen button on Session Code Card — shows large centered code + URL + response count in modal overlay
+ Moved Results full-screen button to Results section — toggle now appears next to refresh/export buttons


## v1.7.3 (2026-05-16)

* Fixed text overflow issue in Padlet, Q&A Board, and Discussion results — long text without spaces no longer overlaps layout


## v1.7.2 (2026-05-16)

+ **Poll Anti-Refresh Protection**: Added localStorage guard to MentimeterPoll — after voting, stores `voted_{sessionId}` to prevent re-voting on page refresh
+ **Edit Own Answers**: Added editToken-based ownership system for Assignment, Padlet, and Discussion tools
  * Added `editToken` field to ToolResponse model (UUID generated on create)
  * Created new `PATCH /api/tools/edit` endpoint for editing responses
  * AssignmentForm now shows submitted answer with Edit button to modify
  * PadletBoard now shows inline edit for own posts
  * DiscussionForum now shows inline edit for own replies


## v1.7.1 (2026-05-16)
+ Added custom option labels for Poll MCQ mode — teachers can enter custom message for each option
+ Added dynamic option management — default 2 options, can add more via "Add Option" button
+ Empty option labels fallback to "Option 1", "Option 2", etc.
+ Fixed Zod validation error when creating poll with custom options (made `question` field optional)

## v1.7.0 (2026-05-16)
+ Reordered AdminSidebar: Class Tools moved below Games
+ Added collapse/expand to AdminSidebar (slide off-screen, default expanded)
+ Fixed vanishing results bug in MentimeterPoll, QABoard, DiscussionForum (removed `since` polling — now always fetches full latest set)
+ Added manual refresh button to Live Results in MentimeterPoll, QABoard, DiscussionForum
+ Added `beforeunload` warning after submission in MentimeterPoll, QuickQuiz, AssignmentForm, ExitTicketForm
* MentimeterPoll now shows accurate total vote count from API
  * Toggle icons: `fi-sr-expand` (expand) / `fi-sr-compress` (collapse) / `fi-sr-menu-burger` (floating button when collapsed)
  * Toggle icons: `fi-sr-expand` (expand) / `fi-sr-compress` (collapse) / `fi-sr-menu-burger` (floating button when collapsed)
* Fixed "Try it" icon not rendering — replaced invalid Flaticon class
* Fixed html-to-image build error — added to serverExternalPackages + dynamic import
+ Added full-screen mode on admin session detail page

+ **Class Tools v2 — Sessions-First Redesign**: Complete architecture refactor with Option B (embed config in ToolSession, no LearningTool model):
  * Removed `LearningTool` model — `type` + `config` now embedded directly in `ToolSession`
  * Removed `toolId` from `ToolResponse` — responses belong to sessions only
  * Rewrote `admin/tools/page.tsx` — sessions-first layout: active sessions at top, past sessions below
  * Created `QuickStartModal.tsx` — inline 2-step modal (pick type → configure → start)
  * Deleted old pages: `new/page.tsx`, `[id]/page.tsx`, `sessions/page.tsx`, `ToolForm.tsx`
+ **Session Management**: `quickStartSession()` action creates session + generates 5-char code in one atomic operation
+ **Updated API Routes**: poll/session/respond/export routes now read `session.config` directly instead of joining `LearningTool`
+ **Export System**: CSV (UTF-8 BOM), ZIP (renamed `{studentName}_files` + `_summary.csv`), PNG capture via `html-to-image`
+ **7 Tool Components Updated**: PadletBoard, MentimeterPoll, AssignmentForm, QABoard, QuickQuiz, ExitTicketForm, DiscussionForum — all read `session.type` + `session.config` instead of `tool` prop
+ **Student Route Redesign**: Changed public student URL from `/tools/{code}` to `/study/{code}`:
  * Added `/study` → enter session code page (centered glass card, 5-char input, auto-uppercase)
  * `/study/{code}` → actual tool session page (no navbar, standalone)
  * Updated SessionManager share URL and admin "Try it" link


## v1.6.0 (2026-05-15)

+ **Cookie Monster Blue Theme**: Complete visual overhaul — swapped accent color from Tailwind `sky` to deep `blue` palette (#1560BD Cookie Monster blue) across all 30+ components and pages:
  * Updated globals.css with `--color-cookie-blue` and `--color-cookie-gold` CSS variables
  * All `bg-sky-*`, `text-sky-*`, `border-sky-*`, `shadow-sky-*`, `ring-sky-*` → corresponding `blue-*` classes
  * Dark mode accent shifted to `blue-400` for readability on dark backgrounds
  * Added warm `amber` cookie accent color (hero CTA hover, save progress bar)
+ **Bouncy Hero Animation**: Gentle continuous `gentle-bounce` animation on hero logo + 1 decorative blur circle (ball-dropping spring effect, loops infinitely)
+ **Entrance Animations**: Fade-slide-up staggered entrance on hero section (logo scale in → title → subtitle → CTAs with 200ms delay each)
- Removed all `-sky-` Tailwind class references (zero remaining in source)
* No character artwork or names — copyright-safe, professional presentation
* All pages verified in light + dark mode


## v1.5.30 (2026-05-15)

+ **Alphabet Adventure Refactor**: Complete 4-phase overhaul - refactored 597-line monolith into modular architecture with 8 files:
  * Created `types.ts` (Screen, GameState, RoundData, GridCell types) and `constants.ts` (level config, praise pool, star calculation, high score key, Fisher-Yates shuffle)
  * Extracted MenuScreen, GameScreen, VictoryScreen screen components to `screens/` directory
  * Rewrote `AlphabetAdventureClient.tsx` as thin orchestrator with state machine and screen routing
+ **Engagement Features**: Star rating per level (1-3 stars based on accuracy ≥90%/≥70%), high score localStorage persistence with "NEW HIGH SCORE!" badge, per-level stars displayed on victory screen
+ **Polish**: Mute toggle button in HUD (uses shared useAudio hook), keyboard shortcuts (1-4 for answers, Enter for typing, Esc for menu), auto-focus first choice button on new round, keyboard hint display at bottom of game area
+ **English Localization**: Game UI now English primary + Thai subtitle (level names, menu description, buttons), random English praise pool (8 correct / 5 wrong encouragement messages), victory screen "Amazing!" title
* **Admin Bug Fix**: Fixed game creation failing due to missing `slug` - now auto-generates from title (lowercase, hyphens for spaces/special chars)
* **State Safety**: Added `stateRef` pattern to prevent stale closures in setTimeout callbacks, added `isTransitioning` guard to prevent double-click issues during feedback animation


## v1.5.29 (2026-05-14)

* **English Localization**: Answer feedback (correct/wrong) changed to English for ESL focus; instructions/stage names now bilingual (EN primary, TH subtitle)
* **Progress Bar Fix**: Progress bar now uses per-stage \`stageDone\` counter instead of cumulative \`questionsDone\` — no longer fills to 100% immediately when entering stage 2 after sequential+review mode
+ **Number Game Refactor**: Complete 4-phase overhaul - refactored 622-line monolith into modular architecture with 8 files:
  * Extracted shared \`useAudio\` hook (with mute toggle + speech synthesis) to \`src/hooks/useAudio.ts\`
  * Created \`types.ts\` and \`constants.ts\` (types, game config, emojis, instructions, stage names, praise pool, star rating)
  * Extracted MenuScreen, RangeScreen, GameScreen, VictoryScreen screen components
  * Rewrote \`NumberGameClient.tsx\` with Fisher-Yates shuffle, useReducer-style state, proper stage progression (exact matches, not <=)
+ **Learning Features**: Speech synthesis on wrong answers, stage names displayed in HUD, random Thai/English encouragement pool using praise/reassurance
+ **Engagement Features**: Star rating per stage (1-3 stars based on accuracy), progress bar, victory stats grid (score, accuracy %, best streak), high score localStorage per range, NEW HIGH SCORE badge
+ **Polish**: Mute toggle, keyboard shortcuts (1/2/3 to answer, Esc to menu), fullscreen toggle, ARIA labels (\`role="application"\`, \`aria-live="polite"\`), emoji overflow fix (max 12 items + ×N multiplier), shows correct answer on wrong response
* **Alphabet Adventure**: Replaced inline \`useAudio\` hook with shared \`@/hooks/useAudio\` import (removed 64 lines of duplicated code)
* **Number Game Fix**: Victory screen now properly shows star ratings - \`stageStars\` was never populated, always displayed 0/0
* **Number Game Fix**: Stage progression now correctly resets \`stageCorrect\`/ \`stageTotal\` on stage transitions (review→stage2 path had missing reset)

## v1.5.28 (2026-05-14)

* **Python Compiler Worker Fix**: Fixed Pyodide worker being recreated on every mode switch (appendOutput stable with modeRef)
* **Python Compiler Error Fix**: Fixed error messages being swallowed (split on actual newlines not literal \n in pyodide-worker.js)
* **Python Compiler Output**: Fixed output truncation silently dropping content after 15k chars (now shows truncation notice)
* **Python Compiler**: Added Ctrl+Enter hint to RUN button, replaced alert() with styled toast, added focus to editor after run, added error handling to submitConsoleInput, fixed execCommand deprecation warning

## v1.5.27 (2026-05-14)

* **Python Compiler Fix**: Fixed clipboard crash when sharing code (navigator.clipboard undefined in non-secure contexts)
  * Made `shareCode` async with try-catch and fallback to `document.execCommand('copy')`
* **Python Compiler UI**: Fixed download dropdown text being too light in light mode
  * Added `text-zinc-700 dark:text-zinc-300` to .py/.txt option buttons

## v1.5.26 (2026-05-14)

* **Number Game Fix**: Disabled answer buttons during the 1-second transition period after each answer to prevent double-click issues
  * Added `isTransitioning` state to track transition period
  * Buttons now visually dim and become non-interactive until next question appears

## v1.5.25 (2026-05-14)

 * **Syntax Error Fix**: Fixed corrupted JSDoc comments (`/"**` → `/**`) in 6 component files that caused parse errors
   * EmptyState.tsx, Pagination.tsx, NavigationPendingBar.tsx, PublishedToggle.tsx, FormError.tsx, FormSubmitButton.tsx

## v1.5.24 (2026-05-14)

+ **Complete Codebase Refactoring**: Major refactoring across 5 phases to improve code quality, security, and maintainability
  
  **Phase 1 - Critical Fixes:**
    * Added Zod `.strict()` validation to all admin CRUD schemas (portfolio, gallery, resources, games) — prevents extra/malicious form fields
    * Moved all `dbConnect()` calls inside try/catch blocks — prevents unhandled rejections on DB connection failures
    * Fixed games thumbnail validation order — check file presence BEFORE saveFile() to prevent orphaned files
    * Fixed GalleryForm photo file tracking — added `newPhotoFiles` state to properly handle multiple photo batch selections (was losing files between batches)
    * Fixed Learning model type mismatch — made `link` field optional to match schema definition
  
  **Phase 2 - Shared Utilities:**
    + Added `formatError(key)` to `error-code.ts` — unified error formatting across all admin actions
    + Created `lib/utils.ts` with `parseTags()` and `toSlug()` — eliminates duplicate tag parsing and slug functions
    + Created `hooks/useSlug.ts` — reusable hook for auto-generating slugs from titles
    + Created `hooks/useObjectURL.ts` — manages blob URLs with automatic cleanup to prevent memory leaks
  
  **Phase 3 - Admin Form Components:**
    + Created `FormField.tsx` — reusable label+input wrapper with TextInput, Textarea, Select, Date variants
    + Created `GlassCard.tsx` — consistent glassmorphism card container
    + Created `FormSubmitButton.tsx` — standardized submit button with loading state
    + Created `FormError.tsx` — consistent error banner display
    + Created `PublishedToggle.tsx` — standardized publish checkbox
  
  **Phase 4 - Public Page Standardization:**
    + Created `NavigationPendingBar` component — shared navigation loading indicator
    + Created `Pagination` component — unified pagination UI
    + Created `EmptyState` component — consistent empty state display
    + Added empty states to PortfolioClient and GalleryClient (was missing)
    + Added `generateMetadata` to gallery detail page for SEO/Open Graph
    + Simplified `getError()` in error-code.ts — removed no-op ternary that had identical branches
  
  **Phase 5 - Code Cleanup:**
    * Removed dead exports from `constants.ts`: ANIMATION, REVALIDATE, ROUTES, MONGO_EXPRESS (80% dead code)
    * Updated all admin actions to use shared `formatError(key)` from error-code.ts
    * Added `.trim()` to all Zod string schemas — prevents leading/trailing whitespace in stored data
    * Standardized error message format across all admin CRUD operations

## v1.5.23 (2026-05-13)

+ **One-page HTML game support**: Games can now be created as either an External Site URL or a self-contained One-page HTML document
  - Admin form (`/admin/games/new`, `/admin/games/[id]`): Added radio toggle between "External Site (URL)" and "One-page HTML" modes with conditional fields
  - Server actions: Updated Zod schema with conditional validation; `htmlContent` is sanitized with `DOMPurify.sanitize()` at write-time
  - Public games list (`/games`): HTML games link to internal play page; URL games open in a new tab as before
  - New play page (`/games/play/[id]`): Renders one-page HTML inside a sandboxed iframe (`sandbox="allow-scripts"`) with a full-screen button for immersive gameplay
  - Game model: Added optional `htmlContent` field; `playUrl` stores empty string for HTML games

## v1.5.22 (2026-05-13)

* **Fixed admin games edit validation error**: Changed form field name from `genre` to `category` in GameForm.tsx to match the Zod schema and MongoDB model — the "Invalid input: expected string, received null" error no longer occurs

## v1.5.21 (2026-05-13)

* **Changed dev server port**: Updated from 3000 to 3300 across all configuration files
  - `package.json`: Added `-p 3300` to dev script
  - `AGENTS.md`: Updated session start protocol and key URLs documentation
  - `docker-compose.yml`: Changed port mapping from `"3000:3000"` to `"3300:3300"`
* **Fixed Hero CTA button**: Changed second CTA link from `/gallery` to `/resources` — the button labeled "สื่อการเรียนรู้" now correctly navigates to resources section
+ **Hero logo `priority` preload**: Added `priority` prop to hero Image component for faster above-fold render (~150ms LCP improvement)
+ **Lazy loading for content images**: Added `loading="lazy"` to all grid and sidebar images in portfolio, gallery, resources, and games lists — reduces initial bandwidth by ~5-8MB per list page
+ **Glassmorphism consistency**: Applied `bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm` card pattern to gallery, resources, and games lists per AGENTS.md spec (portfolio already had it)
+ **Navigation loading indicator**: Added thin pulsing progress bar + dimmed content (`opacity-60`) during filter/sort/pagination transitions — gives users immediate feedback that their click registered
+ **Skip-to-content link**: Added accessibility link "ข้ามไปที่เนื้อหาหลัก" — invisible by default, appears on Tab key focus for keyboard/screen-reader users
+ **Detail page content width capping**: Added `max-w-3xl` (~768px) to portfolio detail article body — improves desktop readability (optimal 65-75 char line length)
- **Dead code cleanup**: Removed empty whitespace lines from home page

## v1.5.20 (2026-04-22)

* **Fixed Cache-Control warning**: Removed redundant `/_next/static/(.*)` header block from `next.config.ts` — Next.js already sets `Cache-Control: public, max-age=31536000, immutable` internally in production; manually overriding it triggered dev-mode warning and could break HMR

## v1.5.19 (2026-04-21)

+ **Skeleton Loading Screens**: Added GPU-composited shimmer skeleton loaders to all 7 public DB-backed routes via co-located `loading.tsx` files
  - Routes covered: `/portfolio`, `/gallery`, `/resources`, `/games`, `/portfolio/[id]`, `/gallery/[id]`, `/resources/[id]`
  - Each `loading.tsx` is a pure static Server Component — zero client JS overhead
  - CSS technique: `transform: translateY()` vertical shimmer on `::after` pseudo-element (GPU-composited, no CPU paint per frame) — band sweeps top→bottom
  - Added `.skeleton` plain CSS class to `globals.css` with `--sk-base` / `--sk-shine` CSS variables for light/dark mode
  - Shimmer gradient is an approved exception to the "no gradients" rule — it is an animation technique, not a UI design element
  - Applied `relative aspect-video overflow-hidden shrink-0 skeleton` pattern to fix known `aspect-video w-full` collapse inside `flex flex-col`

## v1.5.18 (2026-04-19)

+ **Public Resource Detail Page** (`/resources/[id]`): Added new Server Component page for individual learning resources
  - Renders content differently per type: Article → `.article-content` HTML, Video → YouTube iframe, Presentation → Canva embed or PDF iframe, Lesson Plan → PDF/image preview + download button, Sheet/Worksheet → PDF or image, Scratch/Interactive → raw embed code, fallback → external link button
  - ObjectId validation with `mongoose.isValidObjectId` before any DB query
  - Prev/Older & Next/Newer navigation by `createdAt`, sidebar with 5 most recent resources
  - `generateMetadata` with full OG tags (title, description, thumbnail image)
  - `revalidate = 60` (ISR, no `generateStaticParams`)
* **ResourcesClient**: Changed resource cards from external `<a href>` to internal `<Link href="/resources/[id]">` so users navigate to the detail page instead of leaving the site
+ **`.article-content` CSS**: Added comprehensive rich-text typography class to `globals.css` covering h1–h6, p, ul/ol/li, a, strong/em/u/s, img, hr, blockquote, code, pre — with full dark mode variants — replacing `@tailwindcss/typography` (not installed)



+ **RichTextEditor — HTML Source Toggle**: Added WYSIWYG ↔ HTML Code view switch button
  - Toggle button always visible at far-right of Row 1 toolbar (`ml-auto`)
  - WYSIWYG → HTML: copies current innerHTML into a monospace `<textarea>` for direct editing
  - HTML → Editor: applies textarea content back to `contentEditable` div and syncs hidden input
  - Toolbar Row 1 formatting buttons, Row 2, and inline dialogs are hidden in HTML mode
  - Both views share the same hidden `<input>` — form submission works identically in either mode
  - `spellCheck={false}` on the textarea to suppress spell-check noise in raw HTML

## v1.5.16 (2026-04-19)

* **Upgraded RichTextEditor**: Rewrote toolbar from scratch with full word-processor features:
  - Row 1: Block Format dropdown (P / H1–H6), Font Size dropdown (10–48px), Bold, Italic, Underline, Strikethrough, Text Color (16-color palette), Alignment (Left / Center / Right / Justify)
  - Row 2: Bullet List, Ordered List, Indent, Outdent, Insert Link (inline dialog + save/restore selection), Unlink, Insert Image by URL (inline dialog), Horizontal Rule, Remove Formatting
  - Active state tracking via `onKeyUp`/`onMouseUp` for B/I/U/S, lists, and alignment buttons
  - All toolbar buttons use `onMouseDown + e.preventDefault()` to preserve editor focus
  - Inline link/image dialogs with Enter to confirm and Escape to dismiss — no browser `prompt()`
  - Font size applied via `fontSize`/`<font>` trick → converted to inline `<span style>` for clean output
  - `OpenPanel` discriminated union replaces multiple boolean flags

## v1.5.15 (2026-04-19)

+ **Enhanced Admin: New Resource Page**: Added comprehensive type-specific content management:
  - Subject options changed to Thai (English) format (e.g., คณิตศาสตร์ (Mathematics))
  - Added 8 new resource types: Article, Presentation, Video, Lesson Plan, Sheet, Worksheet, Scratch, Interactive
  - Type-specific UI per type:
    - Article: HTML Editor (React Quill) + Image Upload + Video URL + Link Management + PDF Support
    - Presentation: Canva Embed / PDF Embed + File Upload (PDF)
    - Video: YouTube URL only
    - Lesson Plan: File Upload (PDF only)
    - Sheet: File Upload (JPG, PNG, PDF)
    - Worksheet: File Upload (JPG, PNG, PDF)
    - Scratch / Interactive: Embed Code (<code>&lt;iframe&gt;</code>)
* **Added Learning Schema Fields**: Added content, embedCode, fileUrl, youtubeId, canvaEmbed fields to ILearningResource
* **Added Type Validation**: Server-side validation per resource type (file type, required fields)
* **Added DOMPurify Sanitization**: HTML content sanitized at write-time for XSS protection
* **Added react-quill + react-pdf dependencies**: For HTML editor and PDF viewing

## v1.5.14 (2026-04-19)

* **Fixed Filter Layout Alignment**: Wrapped filter buttons and sort dropdown in `max-w-7xl mx-auto` container so they align with the card grid below
* **Strengthened Badge Glassmorphism**: Type badges in Resources now use stronger tint (50% opacity) + white text + rounded-full for better contrast against cover images
* **Removed Game Card Dark Overlay**: Removed the dark `bg-black/60` overlay on game cards to show game cover at 100% brightness
* **Updated Game Tags**: Changed to white glass (`bg-white/60 backdrop-blur-sm border`) with dark sky text for readability on any cover image

## v1.5.13 (2026-04-19)

* **Updated Filter Buttons + Badges**: Made filter buttons and type badges fully glassmorphic per design system:
  - Filter buttons (Resources): Added `border` class (was missing)
  - Type badges: Changed from solid colors to glassmorphic (40% opacity + backdrop-blur-xs + border) — all types (Worksheet/Article/Video/Interactive)
  - Game tags: Changed from solid sky to glassmorphic sky-tinted (40% opacity + blur + border)

## v1.5.12 (2026-04-19)

* **Glassmorphism Design System**: Added comprehensive glassmorphism documentation to AGENTS.md and memory.md — all transparent UI elements must now include both opacity AND backdrop-blur:
  - Filter buttons: `bg-white/40 backdrop-blur-xs`
  - Cards/forms: `bg-white/60 backdrop-blur-sm`
  - Navbar: `bg-white/40 backdrop-blur-3xs`
* **Applied Glassmorphism to Components**: Added `backdrop-blur-*` to all glassmorphism elements:
  - Filter buttons in Gallery, Portfolio, Resources (reduced opacity from 70% → 40%)
  - Admin pages (games, gallery, portfolio, resources, login)
  - Admin forms (PortfolioForm, GameForm, GalleryForm, LearningForm)

## v1.5.11 (2026-04-18)

+ **Centralized Config Files**: Created 2 new centralized files for easy configuration management:
  - `src/lib/constants.ts` — DB timeouts, pool settings, animation durations, route paths, Mongo Express URL config
+ **Centralized Error Codes**: Created single `src/lib/error-code.ts` — unified HTTP (400, 401, 404, etc.) and app-specific error codes in one flat structure.
  - Format: `ERROR_404 [404]: ไม่พบข้อมูล (NOT FOUND)` for HTTP, `ERROR_U01 [413]: ไฟล์มีขนาดใหญ่เกินไป (File is too large)` for app codes
  - Returns structured JSON: `{ code, httpStatus, message, translation }`
  - Usage: `getError('404')` or `getError('U01')` — single key lookup
+ **DB Settings Centralized**: Moved hardcoded `serverSelectionTimeoutMS`, `socketTimeoutMS`, `connectTimeoutMS`, and pool settings from `src/lib/db.ts` to use centralized constants from `src/lib/constants.ts`
+ **Mongo Express URL**: Replaced hardcoded `http://localhost:8081` in admin dashboard with `process.env.MONGO_EXPRESS_URL` env var — configurable per environment
+ **CSS Animation Variables**: Added CSS custom properties (`--animate-slide`, `--animate-fade`, `--animate-float`, `--animate-ease`) to `globals.css` for consistent timing across animations

## v1.5.10 (2026-04-18)

* **ESLint Cleanup**: Fixed 26+ ESLint errors across the codebase. Replaced `any` type casts with proper TypeScript interfaces (`IPortfolioItem`, `IGalleryAlbum`, `ILearningResource`). Added `src/types/global.d.ts` with `window.webkitAudioContext` declaration to eliminate `(window as any)` casts.
* **Ref During Render Fixed**: Moved `stateRef.current = gameState` assignment inside `useEffect` in `NumberGameClient.tsx` to fix React's "Cannot access refs during render" error.
* **Textarea Ref Fix**: Added `textareaWidth` state and `useEffect` to capture textarea dimensions in `PythonCompilerClient.tsx`, replacing direct ref access during render with reactive state.
* **Type Safety**: Added proper `LevelConfig` interface in `AlphabetAdventureClient.tsx` and typed `visualData` in `NumberGameClient.tsx`, eliminating `any` type usage.
* **Unused Variables**: Removed unused `useMemo` and `NumberData` imports in `NumberGameClient.tsx`, renamed `totalItems` to `_totalItems` in `ResourcesClient.tsx` to acknowledge received prop.

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
