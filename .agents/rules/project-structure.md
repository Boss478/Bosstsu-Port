# Codemap — Boss478

> File index for fast lookups. Last synced: 2026-06-09

## Route Groups
- `(website)/` — Public site (Navbar/Footer layout, home, portfolio, gallery, resources, games)
- `(standalone)/` — Standalone layouts (alphabet-adventure + games)
- `admin/` — Protected CMS (JWT middleware, sidebar layout)
- `api/` — API routes (upload, pyodide-input, process-words)

## Games

### Alphabet-Adventure (standalone)
Route: `/games/alphabet-adventure` (+ `/beta`)
Files: AlphabetAdventureClient(screen router), useGameActions(state machine/card drops), cards/cards(CardTier/TIER_LETTERS/CARD_EMOJIS/rollCardDrop/addCard), cards/CardFrame/CardIllustrations, screens/Menu/Game/Overlays/Victory/Onboarding, screens/MatchLevel/FillLevel/TypingLevel, beta/CardScreen/CardRevealModal, characters/CaptainAlph/Mermaid/TreasureMonster, constants/types
Patterns: 6 levels(match→fill-upper→fill-lower→typing). Card drop: rollCardDrop→pickLetter→addCard(localStorage). Reveal: 1s→CardRevealModal→handleCardKeep→finishGame. Beta: CardScreen collection manager

### Number Game (website)
Route: `/games/number-game`
Files: NumberGameClient, screens/Menu/Game/Range/Victory, types/constants

### Phonics (website)
Route: `/games/phonics`
Files: PhonicsClient, context, screens/Map/Game/Settings/SaveSlot/Victory, components/PixelSprite/ModeSelectModal, words/map/sprites/save/types/constants

### Computer Lab (website)
Route: `/games/computer-lab`
Files: ComputerLabClient, context, screens(8): Menu/Build/Hardware/Software/Diagnosis/Workflow/Pong/Victory, components(16): TopBar/SimControls/SimMonitor/SimDeskView/SimBuildDesk/SimSpecsPanel/SimSettingsPanel/SimTaskManager/SimComponentPopup/SimComponentDrillDown/DailyChallenge/BootScreen/LoadingScreen/Certificate/ProfessorPixel/PixelSprite/CatEasterEgg, hooks(4): useSimulationSpeed/useDataFlow/useComponentState/useKonamiCode, simulation/workloads/positions/types, sprites/save/lang/audio/types/constants

### Spellchecker (website) — Flashcards
Route: `/games/spellchecker`
Files: FlashcardClient, FlashcardContext, screens/Menu/Playing/Result, actions/types

## Public

### Portfolio
Route: `/portfolio` → page, [id]/page, PortfolioClient, data. Admin: page/new/[id]/actions

### Gallery
Route: `/gallery` → page, [id]/page, GalleryClient, AlbumContent, data. Admin: page/new/[id]/actions

### Resources
Route: `/resources` → page, [id]/page, ResourcesClient, data. + python-compiler/page. Admin: page/new/[id]/actions

### Tools (stub) — empty, no files

## Admin
Files: layout, AdminLayoutShell, page(dashboard), LogoutButton, login/page+actions
Pattern: each section = page + new/page + [id]/page + actions.ts (same for portfolio/gallery/games/resources/tools)

## Models (src/models/ — 13)
Portfolio, Gallery, Game, Learning, Tag, Subscription, Budget, Transaction, StockWatchlist, StockHolding, ToolSession, ToolResponse, ToolStepTemplate

## Lib (src/lib/ — 23)
Auth: auth-base(HMAC), auth(JWT), private-auth, client-token
DB: db(Mongoose, pool:3, bufferCommands:false)
Config: config, env
Upload: upload(30mb,sharp), client-upload
Utils: validation, error-code, format, numbers, shuffle, period, fetch-published, admin-crud, routes, nav-links
Hooks: useFormSubmit(3-phase), useFocusTrap(tab/shift+tab)
Other: session-code, rate-limit(5/15min), tool-translations

## Known Gotchas
- `duration-600` invalid → `duration-[600ms]`
- `aspect-video` + flex column = 0 height. Use `h-48 sm:h-56 shrink-0`
- Thai font(2xl+): avoid bg-clip-text, use leading-relaxed, avoid leading-tight
- Safari scroll fix: `fixed inset-0 overflow-hidden overscroll-none` root + `min-h-dvh` main
- Card reveal race: finishGame 1500ms after 1000ms card delay → 500ms modal. Fix: defer until handleCardKeep
- serializeDoc: ObjectId→string via SerializedDoc<T> in db.ts
- admin CRUD pattern: page.tsx + new/page.tsx + [id]/page.tsx + actions.ts per section

## Dev URLs (localhost:3300)
`/` `/portfolio` `/gallery` `/resources` `/games` `/games/alphabet-adventure` `/games/alphabet-adventure/beta` `/admin`
