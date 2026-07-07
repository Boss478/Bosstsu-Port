# Project Memory

## Version History

| Version | Key Changes |
|---------|-------------|
| v1.10.57 | Flaticon rebuild (178 icons, 30KB woff2 — was 94KB). Vocab Path cloud progression (5-tier vertical accordion). Challenge multi-select CEFR + group filters (intersection logic). Fix: sequential str.replace cascade during icon rename (23 files corrupted, restored from git, replaced with single-pass regex). Fix: React duplicate key `charm` (pronunciation-dictionary.json multi-dialect). |
| v1.10.56 | Vocab Group + CEFR filter for Challenges (ChallengeSelectScreen filter bar, ChallengeGameScreen words prop, ChallengeQuizScreen config-driven generators). |
| v1.10.55 | Synonym group fallback: `getWordsForGroup` 3-tier fallback (strict→broad+level→broad-only) for synonym groups. `broadWordMatch()` searches synonymOf terms against word+definition+example+synonyms. All 22 synonym groups now serve 3+ words. 4 new tests. `wordGroupMap` remains strict for display accuracy. |
| v1.10.54 | Challenge Word Builder mode (6 challenge types, configurable Quiz engine), 7 a11y fixes (focus trap, dialog semantics, accordion keyboard, aria-live, back button, aria-hidden), 16 challenge generator tests, dead code removal. ESLint pre-commit caught 4 errors (saveRef immutability, setState in effects) — fixed with lazy state initializers and closure-based patterns. Bug fixes: `{pct}` literal rendering (missing `$`), Speed Run timer dead code condition. |
| v1.10.53 | LibraryScreen nested `<button>` fix (phoneme grid card): outer `<button>` + absolute-positioned sibling practice `<button>` instead of nested `<button>` inside `<button>`. Resolves React hydration warning. P3 cosmetic. |
| v1.10.52 | Admin test infrastructure fix: removed `async` from `WordOverride.findOne` mock (broke `.select()` chain), replaced `vi.clearAllMocks()` with targeted reset. 704 tests pass, build clean. |
| v1.10.51 | Phonics save layer overhaul (writeSave non-mutating, loadSave backfill guards, persistSave race fix, deleteSave in-memory reset), GameScreen hint stale closure fix (useState→useRef), achievement dead context flags removed (companion_friend unconditional, first_purchase save-data-only formula, removed shopPurchase/companionClick/wordBuilderLookup/wordQuizComplete). 232 tests. |
| v1.10.50 | Alphabet Adventure stabilization: 5 bug fixes (cardDroppedRef race, Escape leak, onboardingSeen persistence, roundSeed reset, VictoryScreen 0/0), drop rates→constants.ts, 78 new tests (drops/scoring/generators/integrity), card screen polish (Play Now CTA, sort stability). |
| v1.10.49 | Fixed biased shuffle (54 locations → Fisher-Yates) and card-flip stub (now uses lesson phoneme/word). 27 new tests (shuffle + card-flip). |
| v1.10.48 | Vocab Activity Expansion: 4 new question types (antonyms, collocations, fill-blank, word-assoc) with generators and router wiring. CEFR+Accuracy scaling. FillBlankQuestionComponent + WordAssocQuestionComponent. `antonyms: string[]` field added to WordData and all 5648 words. 25 tests. |
| v1.10.47 | Cartoon-realistic card overhaul: added thick outlines, 3D beveled borders, offset extruded plaque nameplates, double-beveled portrait arches, and bezel-mounted gems to achieve TCG cartoon aesthetics. |
| v1.10.46 | Redesigned collectible cards visually with premium gemstone/metallic borders, 3D radial sphere highlights for gems, spotlight/vignette backgrounds for illustrations, cosmic geometric mandalas for card backs, and a GPU-accelerated hover gloss shine sweep. |
| v1.10.45 | Mapped missing icons, resolved auto-dismiss toast loop, corrected incorrect grading of new phonics activities, eliminated overlapping distractors, and fixed target phoneme focus bug in IPA-to-Word/Word-to-IPA/stress question generators |
| v1.10.44 | Overlay Z-Index & React Portal Integration for drawer and modal components |
| v1.10.43 | Glassmorphic Backdrop & Transition animation fixes |
| v1.10.41 | Phonics Sound Path revamp: replaced Listen&Pick with Grapheme Match, added Minimal Pairs + Stress activities. 3 new generators, 3 new UI components, adaptive scaling, exercise rebalance |
| v1.10.42 | Fixed Grapheme Match 2-question ceiling (single-grapheme phonemes), fixed Minimal Pairs infinite loop guard, added example-word pairing for grapheme questions |
| v1.10.36 | WordQuiz Soundboard sort settings (gear + modal), WordBuilder IpaToWordTab sort toggle scope bug fix, 3 new tests |
| v1.10.35 | 4 Phonics UX features: IPA→Word quiz bug fix (word hidden in normal mode), Companion on WB+WQ screens, Soundboard sort (grouped/flat + 3 sort orders), CEFR 60/30/10 bucket-based word selection. 17 new tests. |
| v1.10.34 | Phonics Expansion v2 — 5 challenge activities, interactive companion (progressive hints + streak messages), 25 achievements/badges, enhanced profile (heatmap/CEFR ladder/sparkline), 6-tab footer, SAVE_VERSION 2→3 |
| v1.10.33 | 6-phase code refactoring: QuestionChoiceButton, WordPill, DictEntry consolidation, CSS constants extraction, dead code removal |
| v1.10.32 | Phonics Game: Word Builder Prediction Feature — Added G2P prediction (rule-based grapheme-to-phoneme) for unknown words in Spelling→IPA tab, showing predicted IPA in amber PREDICTED cards. Added phoneme edit distance (Levenshtein) + P2G spelling generation for unmatched phoneme sequences in IPA→Word tab. Two new utils: `g2p.ts` (digraph/vowel/consonant/silent letter rules) and `phonemeSearch.ts` (edit distance, closest words, dict-validated spelling generation). |
| v1.10.31 | Phonics Game: Word Builder Settings — Added segmented Phoneme Button Labels selector ("Both", "IPA Only", "Word Only") to customize soundboard key representations, and added a Show Search History toggle to show/hide the "Recent Searches" history pills, with both settings persistent in `localStorage`. Resolved all React mount effect linter warnings by converting settings state initializers to lazy functional state loads. Fixed slate background styling class typo on history pills. Capitalized typed input text, matching word suggestions, search history entries, and target letter blocks under the search bar in the Spelling -> IPA builder flow to match the QWERTY keyboard keys. |
| v1.10.30 | Phonics Game: Word Builder UI & UX Polish — Restructured Spelling and IPA tabs into responsive split two-column dashboards on desktop (`lg:grid-cols-12`) with left-side display cards and right-side input decks, expanded container width to `max-w-6xl`, balanced QWERTY keyboard with Shift key + responsive key dimensions, wrapped suggestions dynamically via flexbox, replaced native tooltips with custom CSS overlays, stacked phoneme groups vertically (`flex flex-col gap-5`) with `whitespace-nowrap` on labels to prevent characters wrapping inside cells; added global layout settings gear button in header triggering a glassmorphic modal with Side-by-Side vs Stacked Rows stacking options, Zoom control setting (70% - 200%) persisted via `localStorage`, wrapper flexible height fixes, conditional panel min-heights, and side-by-side soundboard categories grid compression (3x height reduction) in stacked layout mode |
| v1.10.27| Phonics Game: Removed inline Choose Companion Mascot customization from Profile screen |
| v1.10.28-dev| Phonics Island Sound/Vocab Phase 3 — Vocab tab restructured with 6 CEFR groups, 4 sequential activities per stage (def-to-word/word-to-def/synonyms/vocab-exercise), new question generators (synonym/exercise/vocab-exercise), 3 new components (VocabGroupMapView/VocabStageSubMap/VocabActivityPath), activity progress tracking |
| v1.10.26| Phonics Game: Bottom navbar responsive threshold adjusted from <= 320px to <= 325px |
| v1.10.25| Phonics Game: Bottom navbar hides text and shows only icons on screen widths <= 320px (Mobile L support) |
| v1.10.24| Phonics Game: Reduced all glassmorphic components' backdrop-filter blur multipliers by 10% |
| v1.10.23| Phonics Game: Added Dark Theme toggle switch under VISUAL section of Settings screen |
| v1.10.22| Phonics Game: Contrast optimizations for settings controls (Mute switch off-state background, Glass effect slider track, labels readability) |
| v1.10.21| Phonics Game: bottom navbar max-width increased by 25% (max-w-md to max-w-[560px]) |
| v1.10.20| Readjusted Glass Effect slider: changed default/reset value to 25 and divided by 50 in computation to align with the 50-step slider |
| v1.10.19| 30-question CEFR placement test, speech setting button controls, quick practice button, companion mascot modal picker, escape JSX entities in settings |
| v1.10.18| 13-phase Phonics UI overhaul: 10 new words, 5-col Soundbook, profile companion circle, slot rename/delete, shop tabs, retry incorrect victory, answer feedback, audio visualizer, settings glass sliders, placement test, tutorial, draggable mascot, transitions |
| v1.10.17| Split Vocab path stages into 11 sub-grouped stages (A1.1 to C2) on the winding serpentine progress map, resolved level dynamically by hyphen split |
| v1.10.16| Split Sound and Vocab paths, Vocab path grouped by CEFR level, floating glass footer, adjusted clearances, corrected Soundbook text contrast |
| v1.10.15| Reusable Phonics BackgroundDownloadWidget component, game screen fixed positioning overlay under HUD navbar, and instant mount caching evaluation |
| v1.10.14| Phonics Speech Rate/Pitch settings range sliders, interactive Victory Screen question review pronunciation details card tooltips (showing IPA, syllable breakdown, stress indicators, definition, example sentence, Web Audio playback), extracted Analytics components, HUD cleanup |
| v1.10.13| Phonics Soundbook Free Practice, Persistent Speech Voice selector, dynamic greetings & sizing, centered mascot alignment, AudioBuffer prefetching/decoding, browser-side HTTP Caching, First-Join Loader, Progressive Background Stage Loader, 50-word Phonics vocabulary expansion (29 to 79 words) with stage-scoped replay randomization, Adaptive CEFR levels (A1-C2 grid setting, onboarding level/placement test prompt, distance-weighted probabilities selection for target/distractors, streak-based upgrade/downgrade performance scaling) |
| v1.9.10 | Stage Manager Modal, Multi-Step File Upload Config Resolution |
| v1.9.11 | Multi-Step maxSubmissions + Step-Scoped Counting |
| v1.9.12 | Phase 3 Bundle Opt, Docker Build + ISR Fix |
| v1.9.13 | Phase 4 Backend/Query Opt |
| v1.9.14 | Phase 5 Arch, select:false Content Fields |
| v1.9.15 | Dead Code Cleanup 2 |
| v1.9.16 | Security (XSS + Timing), Custom opencode Agents |
| v1.9.17 | Stock Dashboard |
| v1.9.18 | Login Redirect Fix, STOCK→PRIVATE Rename |
| v1.9.19 | Portfolio Dashboard |
| v1.9.20 | Icon Audit, Chart Views, Stock Hardening |
| v1.9.21 | Finance Tracker Build Errors |
| v1.9.23 | Subscription, Budget Planner |
| v1.9.24 | Salary Periods, UX Scrutiny |
| v1.9.25 | Docker Profile, NODE_ENV Leak, Missing Env |
| v1.9.26 | SaveProgress Implementation |
| v1.9.27 | SaveProgress Icon Fix, AGENTS Restructure |
| v1.9.28 | DB-First Save Flow |
| v1.9.29 | Flaticon Font Subsetting (314KB→9.2KB), Perf 66→85 |
| v1.9.30 | Computer Lab game Phase 1 — UI shells (16 files) |
| v1.9.31 | Computer Lab Phase 2+3+4 — Lang/audio/save/BIOS/context + all 5 game stages + Victory + Professor Pixel, Certificate, Daily Challenge, Guided Tour, Lab Tools, Pong, Easter Eggs, Room Evolution, Window Day/Night, Lab Coat |
| v1.9.32 | YouTube/Roblox/Spotify sprite redesign — play triangle, R logo, sound wave bars added; Stage 3 Workflow animated data flow dots |
| v1.9.33 | Computer Lab desktop theme rewrite — all 5 stages + menu use unified SimDeskView |
| v1.9.34 | Image upload overhaul: batchId temp prefix, preview cap 20, parallel batches (concurrency 3), size warning, photo pagination (30/page + load more) |
| — | Computer Lab polish (post v1.9.33): wire gray+L-shaped waypoints, speed 0.25×-3×, case interior dark overlay+scaled sprites+click→popup+translated tooltips, workload designer (8 dataset types + 8 apps, tabbed UI), route badges+pulse on data dots, SVG rendering fix (+viewBox+preserveAspectRatio), interior position/stopPropagation/double-render fixes |
| — | Computer Lab v2: L-shape wires (keyboard→cpu fix, ssd/hdd stagger), 3 sub-lanes outside case with data dots+trail, settings panel (concurrency/resource/workload/datasize), specs panel (8 sliders replacing Performance/Crash scenarios), emergent crash detection (thermal/ram/disk/OOM/bottleneck), SimScenarioPanel deleted, laneIndex per packet, bus caseBoundaryProgress |
| — | Production performance baseline (2026-06-03): Lighthouse CWV audit + autocannon stress test (10-stage ramp, 1→200 conn) + bundle analysis. All pages survive 100 conn at 0% errors. LCP < 1.1s. Budget docs + lighthouserc.js created. |
| v1.9.35 | Email fix in footer |
| v1.9.36 | Alphabet Adventure: 2 new levels (Thai Match + Phonics Match), sound button on letter card, streak tracking, auto-next after 2 wrongs, progress persistence (Continue button), victory confetti, score in feedback, showCorrect dead code activated, dataPool architecture |
| — | Teacher review fixes: sound button per-level content (Thai/phonics/English), easy mode KG toggle (2 choices, 15 rounds, skip typing), per-letter error tracking (wrongLetters display on victory) |
| v1.9.38 | Card collection system (5 tiers, streak-scaled drops), BETA route (/beta/), CardScreen album, Captain Alph mascot, card toast notification |
| v1.9.39 | Card improvements: Mermaid + Treasure Monster SVGs, progress bar, recently earned carousel, back-to-top, reveal sound, debug toggle |
| v1.9.40 | Teacher review fixes (sound per-level, KG mode, error tracking, Thai reverse, voice picker) + card features (rarest crown, card backs, in-game overlay, achievements, stats page, animation polish) + phonics revert + drop rate adjustment |
| v1.9.41 | Alphabet Adventure scrutiny fixes: gradient violations → flat colors, easy mode toast +1 Drop Power badge, drop rate rebalance (none 85→70%, common 8→4%, etc), per-tier pickLetter shuffle bag, drop power hover tooltip on fill-round cells, card screen sound effects |
| v1.9.42 | Alphabet Adventure refactor: shared shuffle in src/lib/shuffle.ts, isHolographicTier helper, TIER_DOT cleanup, MatchLevel/FillLevel/TypingLevel extraction, GameOverlays component, useGameActions hook (AA Client 774→180 lines) |
| v1.9.43 | Alphabet Adventure drop rate rebalance (base rates adjusted, getNoneDropRate derives from DROP_RATES) |
| v1.9.44 | Alphabet Adventure BETA integration: card drops + revert mode + debug panel + RESET PROGRESS + Card Collection button live for all players. Voice picker, CardScreen album, CardRevealModal, collection overlay remain BETA-only via `isBeta` prop |
| — | Stage 3 UI Redesign: expanded right panel to w-80 lg:w-96, tabbed software/hardware inputs, Retro Pixel OS double border theme, dynamically rendered bilingual educational bottleneck tips |
| — | Stage 3 Workflow cable casing boundary split (casing terminates at case edge, motherboard traces inside case) + React linter warning fixes (ComputerLabClient, SimMonitor, DiagnosisScreen, SimBuildDesk) |
| v1.9.45 | Dead Code Cleanup: removed 4 unused files (GuidedTour, LabTools, useFaultInjector, state-machine), 10 unused exports, @flaticon/flaticon-uicons dependency, 10 unused CSS rules (~580 lines) |
| v1.9.46 | Phonics Island Game Integration |
| v1.9.47 | Holistic Optimization: CI/CD + Husky + Prettier + Sentry + strict TS + a11y overhaul (WCAG AA) + dynamic imports + next/image gallery + useFormSubmit hook + auth dedup (95%) + domain types + blob URL fixes + sitemap + robots.txt |
| v1.9.48 | Homepage Redesign: Hero rewrite (Thai headline, CSS floating dots, 3 CTAs), StatsBar (DB counters + count-up animation), Spotlight (latest 3 portfolio), restyled Categories (4-col grid, watermark icons). ISR revalidate=60. DB try/catch fallback. Zero new deps. |
| v1.9.49 | Scrolling Animation System: ScrollReveal variants (fade-up/left/right/scale-up) + stagger via CSS nth-child utilities + reduced-motion respect. Hero parallax: 8 dots drift at scroll-dependent speeds via rAF-throttled passive listener + CSS custom properties. Zero new deps. |
| v1.9.50 | Gallery image loading: batch 12/12 + infinite scroll (IntersectionObserver + isLoadingRef guard) + native `<img>`→`<Image>` + WebP for gallery uploads + CSS shimmer skeleton |
| v1.9.52 | Text selection rules: body user-select none, inputs/article-content remain selectable
| v1.9.53 | Session QR code: Custom rounded-SVG QR renderer via `qrcode` npm package shown below session code in admin card (160px) and full-screen modal (240px). CSS `currentColor` for dark mode, precomputed rects via `useMemo`, 4-module quiet zone. |
| v1.9.54 | Card obtain animation fix: removed `isBeta` gate blocking cardReveal modal in non-beta mode, fixed `duration-600` → `duration-[600ms]` (silently failing Tailwind class), enhanced first-obtain feedback with sparkle burst + distinct heading |
| v1.9.55 | Card reveal race condition fix: deferred `finishGame` until user taps KEEP on CardRevealModal — card reveal timer (1000ms) vs finishGame (1500ms) caused modal to be destroyed after only 500ms |
| v1.9.56 | Card glow via box-shadow + CSS vars (not ::after); 5 a11y fixes: aria-pressed, keyboard flip, aria-label buttons, emoji aria-hidden |
| v1.9.57 | Alphabet Adventure wrong-answer behavior: 1st wrong hides correct answer (match levels); progress bar uses levelCorrect instead of round — all-wrong rounds no longer inflate progress |
| v1.9.58 | Alphabet Adventure UX overhaul — onboarding overlay (P0), touch targets (P0), visual instructions (P1), reduced motion (P1), text contrast AA fixes (P1), G.1-2 adjustments (feedback 2s, drop rates, caps), standalone (standalone) route group, focus indicators |
| v1.9.59 | Alphabet Adventure: full scroll elimination — fixed inset-0 + overscroll-none + min-h-dvh. Content compacted to fit viewport (no card scroll). Removed animate-bounce from menu icon |
| v1.9.60 | Alphabet Adventure QoL Phase 1 — card timing 2000ms, click card to keep, sound on question click, mute persistence (boss478-muted), menu progress+counter display |
| v1.9.61 | Alphabet Adventure QoL Phase 2 — wrong answer red+disable, per-letter stats, wrongChoices tracking, showCorrect removal; match level auto-advance restored after 2 wrongs (shows correct answer, no progress) |
| v1.9.62 | Alphabet Adventure Phase 4+5 — wrong answer audio (descending tone), per-session analytics (victory screen breakdown), accessibility (focus trap, aria-live, aria-expanded), high contrast theme toggle |
| v1.9.63 | Fix: multi-step session title/description not saving on edit + description path bug (same class as v1.9.6 maxSubmissions path error) |
| v1.10.0 | Analytics system: first-party analytics (page views, 5 games, resource downloads, form submissions, tool usage), cookie consent banner, admin dashboard with CSV export + hot-reload + RUM/Web Vitals (LCP/CLS/INP) |
| v1.10.1 | Dead code cleanup (phonics + auth-base) + agent hallucination catch: refactor-cleaner inflated claims (13 untracked deletions, phantom sentry removal, inflated export counts). Scrutiny caught all via git verification. |
| v1.10.2 | HEIC client-side conversion: iPhone HEIC→JPEG via heic2any (WASM, no native deps) before XHR upload. Fixes server-side heic-convert/libheif failure on VPS. |
| v1.10.4 | Analytics enhancement: vertical traffic chart, SVG donut charts, OS/device deep data (ua-parser-js), export dropdown (CSV+JPG+PNG), rollup debounce (15-min) |
| v1.10.11 | All 8 mascots designed as kawaii-pixel sprites (Fox, Cat, Bear, Bunny, Penguin, Robot, Alien, Ninja) |
| v1.10.13 | Persistent game shell (StaticHeader/Footer) on settings & victory screens, transparent page backgrounds, Flaticon icon subset emoji replacement pass (6 screens + HUD), audio purchase & save confirmation chimes, removed Arena (leaderboard) tab and replaced with educational Soundbook (phoneme pronunciation library) tab |
| v1.10.12 | Mascot refinements: Alien green→white face, Bunny off-white, Fox taller ears, Penguin white sclera+biger beak, Robot taller antenna, Cat pink ear tips+wider whiskers, Bear muzzle border, Ninja pupils |

## Key Patterns

- **serializeDoc**: ObjectId→string via JSON round-trip. Use `as unknown` bridge for casts
- **fetchPublished**: ISR-safe helper (find+count in try/catch). Pages own distinct+mapping
- **Mongoose bufferCommands: false** — hard-fail on unready connections
- **TailwindCSS 4**: @theme in globals.css — no tailwind.config.ts
- **Dark mode**: Class-based via ThemeProvider, suppressHydrationWarning on `<html>`
- **Alphabet Adventure dataPool**: Match levels use `dataPool: "lowercase" | "thai" | "phonics"` on LevelConfig instead of separate LevelTypes. Generates rounds via `generateMatchRound` / `generateThaiRound` / `generatePhonicsRound`
- **Game progress persistence**: Saved to localStorage via `PROGRESS_KEY = "alphabet-adventure-progress"`. Menu shows "Continue" button if progress exists. Cleared on victory or new game start. Save includes `easyMode` field — mode is preserved on continue.
- **Game difficulty modes**: `easyMode: boolean` on GameState. Easy mode: 2 match choices, 15 match rounds, skip typing. Toggle on menu screen. Round generators accept `numChoices` param. `handleLevelComplete` checks `maxLevel = easyMode ? 5 : 6`.
- **Game error tracking**: `wrongLetters: string[]` on GameState. Pushed on wrong answers in match levels. VictoryScreen shows deduplicated "Letters to Practice" list. Sound button uses `correctChar` + `isThaiText ? "th-TH" : "en-US"` per level.
- **Alphabet Adventure easyMode**: Generator accepts `numChoices` param; `advanceMatchRound` uses 15 as target; typing skipped when `maxLevel = 5`. Toggle on menu.
- **Alphabet Adventure card system**: 5 tiers (Common→Legendary) based on letter difficulty for Thai learners. Each tier rolls independently with rates that interpolate over streak 1→20. Auto-collect on correct answer via `addCard()`. Collection stored in localStorage under `CARD_STORAGE_KEY`. Dropped cards shown as toast notification. CardScreen reads `loadCollection()` for display.
- **BETA route pattern**: `/games/alphabet-adventure/beta/` as nested route under the stable game. Single `AlphabetAdventureClient` component accepts `beta` prop — no code duplication. BETA features gated behind `if (beta)` checks. `MenuScreen` shows BETA button (stable) or Cards button (beta) via `isBeta` prop.
- **CardEntry.lastCollected**: Timestamp set on every `addCard` call (both new and duplicate). Enables recently-earned carousel sorting. Handles legacy data gracefully (optional field, missing = treat as 0).
- **Card reveal sound**: `CardRevealModal` accepts `onPlaySound: (freqs: number[], duration: number) => void` prop. `playSequence` from `useAudio` passed from `AlphabetAdventureClient`. Tier-specific frequency arrays played on card flip via `useEffect` watching `flipped`.
- **SVG mascot pattern**: 100×100 viewBox, `size` prop (default 80), `drop-shadow-lg` class, colorful kid-friendly design. Following CaptainAlph conventions — `Mermaid.tsx` and `TreasureMonster.tsx` use same pattern.
- **Flaticon icons**: Grep-verify class names against CSS (silent failure, no build error)
- **NODE_ENV leak**: Check before diagnosing SSR hook failures
- **Docker env**: New env vars need docker-compose.yml updates for all services
- **File-first vs DB-first**: Revisit save ordering when adding upload features
- **Persistent Game Shell Layout**: Render `StaticHeader` and `StaticFooter` around a `flex-1 overflow-hidden` wrapper. Inner screens use `flex-1 overflow-y-auto bg-transparent` so scrollbars are restricted to the middle section and the root shell's background gradient remains steady and fixed.
- **Emoji Replacement Pattern**: To improve aesthetics, replace color emojis with subset-verified Flaticon CSS icons (e.g. `fi-sr-island-tropical`, `fi-sr-trophy`, `fi-sr-shopping-cart`, `fi-sr-user`, `fi-sr-settings`, `fi-sr-wallet`, `fi-sr-flame`, `fi-sr-medal`, `fi-sr-star`).
- **Soundbook Free Practice Pattern**: Clicking an unlocked phoneme opens a details modal showing IPA representation, audio playback visual rings, and seen/accuracy stats. It features a "PRACTICE" button that launches a targeted 5-question round filter by `phonemeIds` via a mock lesson setup.
- **Mascot Speech Bubbles & Timeout Ref**: Dynamic, tab-sensitive mascot speeches and encouragements coupled with ref-based timeout cleanup to eliminate overlapping overlay blinking bugs.
- **Mascot Representation Rule**: Small avatars and selectors (StaticHeader, settings screen buttons, profile cards, library/stage lists, and save slot selectors) render only the head-only mascot sprites (`AVATAR_NOX_HEAD` / `AVATAR_MIRA_HEAD` / `AVATAR_CHIP_HEAD`) procedurally generated at a native 64x64 resolution (drawn at scale 1, offset 0, 0 using `HEAD_CONFIG` mappings) to render the heads larger, crisper, and detailed on-screen. The bottom-right floating companion bubble renders the highly-detailed full-body idle sprites (`MASCOT_IDLE`, `MIRA_IDLE`, `CHIP_IDLE`) procedurally generated at a native 64x64 resolution (drawn at scale 1 with no offset) to display high-fidelity full-body detailed pixel art on its 64x64 canvas.
- **Speech Synthesis Voice Matching**: Custom hooks (`useAudio.ts`) query `window.speechSynthesis.getVoices()` on `voiceschanged` to maintain a reactive list of available system voices. If no user voice is selected/stored in `localStorage` under `boss478-voice-uri`, it automatically falls back to the first available English voice (`en-*`), prioritizing high-quality names (Google, Natural, Samantha, Premium) to prevent invalid localizations (e.g. Thai) from mispronouncing English phonemes.
- **Server-Side API Proxy for CSP Compliance**: When client-side API requests (like fetching pronunciation audio from the Free Dictionary API) violate browser Content Security Policy (CSP), create a server-side App Router route (e.g. `src/app/api/dictionary/route.ts`) to proxy the request. Server-to-server HTTP calls bypass the browser's CSP restrictions. The proxy also enables standard Next.js fetch caching (`next: { revalidate: 86400 }`) to avoid hitting API rate limits.
- **First Join vs Progressive Audio Prefetching**:
  * **First Join Loader**: Upon first launch (or cache clear), displays a welcome progress overlay and downloads only Stage 1 sounds (`/æ/` and `/e/` vocabulary + example words) to keep the initial load extremely quick and focused.
  * **Progressive Background Loader**: While the user is playing Stage 1, a staggered background effect silently downloads and decodes the words for Stage 2, Stage 3, etc. stage-by-stage in the background (using batches of 3, 500ms batch delay, 3s stage delay), achieving a completely lag-free game progression.
- **Audio Pre-decoding Loading Overlay**: Displays a theme-aligned glassmorphism progress overlay showing progress (e.g. `12 / 24 loaded`) with a floating animated mascot during round asset preparation. Uses a 2.5s timeout backup to prevent game lockups if network connections stall.
- **Aggressive Browser-Side Audio Caching**: Dictionary API proxy returns `Cache-Control: public, max-age=31536000, immutable` headers for successful base64 conversions so the browser permanently caches the heavy audio strings locally, avoiding redundant network hits.
- **Phonics Replay & Distractor Randomization**: Spelling, definitions, and card-flip generators accept `phonemeIds` from `selectedLesson` to restrict the question pool to the active stage/lesson. Distractor selection filters from the active lesson pool first, falling back to the entire `WORDS` list only if the stage pool contains fewer than 3 options. Card-flip pairs choose random matching words for their phonemes instead of hardcoded first matches, keeping replay sessions fresh.
- **CEFR Adaptive Selection**: In the Phonics game, word and distractor generation uses distance-weighted probability selection (`getCefrWeight`) relative to the user's active CEFR level: target level diff=0 (weight 1.0), diff=1 (weight 0.8), diff=2 (weight 0.25), and other levels (weight 0.08/0.01). Level upgrades on $\ge 90\%$ accuracy streak of 3, and downgrades on $< 50\%$ accuracy streak of 2. Phonics stages and Free Practice Phonics/Spelling modes pass the active CEFR level into the generators, sticking to the CEFR level first but mixing other levels in according to these weights. Victory screen level adjustment alerts remain gated strictly to vocabulary (definitions) rounds.
- **CSP-Safe base64 Audio Decoding**: To avoid browser Content Security Policy (CSP) fetch restrictions (e.g., `TypeError: Failed to fetch` on `data:` URLs), decode base64 data URLs directly in JavaScript using `window.atob` to create an `ArrayBuffer` before calling `AudioContext.decodeAudioData()`. This eliminates the need to run `fetch()` on local `data:` URLs.
- **Phonics Path Mode Separation**: By passing `mode="sound" | "vocab"` to a single winding serpent road component (`StageListScreen.tsx`), we separate Phonics sounds practice from Definitions/Vocabulary matching. In Sound mode, only a single full-width button starts phonetic exercises; in Vocab mode, a single button starts definitions. This maximizes code reuse while maintaining separate learning pathways.
- **Floating Glass Bubble Footer**: Styling the static footer as a floating panel centered using absolute/fixed coordinates (`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md`) with glassmorphism styles (`glass-panel rounded-3xl backdrop-blur-md shadow-lg border border-white/20`). FAB buttons must be moved higher (e.g., `bottom-28`) and screen content must increase bottom clearance padding to `pb-36` to prevent the floating bar from obscuring interactive UI controls.

## Known Gotcha: Companion click suppressed on desktop (pointer-events-none + React race)
[v1.10.36] When `pointer-events-none` is toggled during drag state in a click-vs-drag component, desktop browsers may route the `click` event to the element behind the target because React commits `dragging=true` between `pointerdown` and `click`. Fix: avoid `pointer-events-none` for drag-state toggling; use `select-none touch-none` instead. Keep drag-suppression threshold ≥10px for desktop mouse jitter.

## Build & Test Harness Compatibility Gotchas
- **Next.js 16 Build Command Flags**: Next.js 16 does not support a `--no-lint` CLI flag for the `next build` command. To ignore compilation warnings/errors during production build, configure `typescript: { ignoreBuildErrors: true }` directly inside `next.config.ts`.
- **Vitest CLI Multi-Pattern Filtering**: Vitest does not support Jest's `--testPathPattern="..."` CLI option. To run multiple test files or directories matching different patterns, pass them as space-separated positional arguments to the CLI (e.g., `vitest run auth admin/login`).

> Full post-mortems: `/Users/boss123/obsidian-vault/boss-project/`

