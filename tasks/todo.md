# Security & Performance Audit - Findings Report

I have completed the manual codebase audit as requested. Here are the findings:

## 1. Security Checks

- [x] **Headers & CORS**: **VULNERABLE**. `next.config.ts` and `src/middleware.ts` do not implement strict security headers (HSTS, X-Frame-Options, X-Content-Type-Options) or CORS policies.
- [x] **Injection (NoSQLi)**: **VULNERABLE**. Server actions (`src/app/actions/*.ts`) accept raw object payloads without strict type casting or Zod validation. A malicious payload like `{"slug": {"$ne": null}}` could bypass checks.
- [x] **XSS**: **VULNERABLE**. Discovered `dangerouslySetInnerHTML={{ __html: item.content }}` in `/portfolio/[id]/page.tsx` without runtime sanitization (e.g. DOMPurify).
- [x] **DDoS / Rate Limiting**: **VULNERABLE**. No rate limiting is present on `/admin/login` or API routes in `middleware.ts`.
- [x] **Malware / Uploads**: **SAFE**. `src/lib/upload.ts` strictly enforces MIME types via `CONFIG` and processes all uploads through `sharp()`, ensuring only valid images are saved.
- [x] **Phishing**: **SAFE**. All external links in `Footer.tsx` and `AdminSidebar.tsx` correctly implement `target="_blank"` with `rel="noopener noreferrer"`.

## 2. Network Analysis (Browser DevTools)

- [x] **Caching**: **VULNERABLE**. No `Cache-Control` headers for static assets are defined in `next.config.ts`.
- [x] **Data Payloads**: **WARNING**. `getPortfolioItems` and Gallery fetches return full collections without pagination, which will cause massive payloads as the database grows.

## 3. Performance Checks (Lighthouse)

- [x] **Image Optimization**: **VULNERABLE**. `next.config.ts` has `images: { unoptimized: true }` enabled. This completely disables Next.js's built-in image compression (WebP/AVIF) and resizing, significantly hurting Lighthouse scores.
- [x] **Data Fetching/Waterfall**: **VULNERABLE**. Sequential database fetching in `portfolio/[id]/page.tsx` (fetching `item`, then `recentDocs`, then `relatedDocs`, then `newerDoc`, then `olderDoc` synchronously) causes a severe network waterfall effect. These should be combined with `Promise.all()`.

---
**Audit Complete! Please review these findings. I can start implementing the fixes for these vulnerabilities when you are ready.**

# Adding Thai Word Definitions

- [x] Investigate the Royal Society Dictionary website's search mechanism.
- [x] Create a Node.js script `scripts/scrape_thai_words.js` to parse `thai_word.csv` and filter words where `ถูกต้อง` == `true`.
- [x] Implement a scraping function using `axios` and `cheerio` (or `puppeteer`) to retrieve definitions for each word.
- [x] Generate the output CSV `thai_word_with_def.csv` with columns `คำ,ความหมาย`.
- [x] Verify the results manually.

# SpellCheck Game Enhancements

## 1. Feature Additions (Gameplay & Learning)
- [x] Practice Mode: Show definitions on incorrect guesses.
- [x] Result Screen: Add definitions to the "All Word Analysis" table.
- [ ] Optional: Add a "Flip" button to peek at definitions.
- [ ] Optional: Add audio/visual polish for correct/wrong guesses.

## 2. Data Processing & Centralization
- [x] **Use Deeper Data Sources:** Update `page.tsx` to read from `src/data/games/spelling/spelling_thai_word.csv` and `src/data/games/spelling/spelling_english_word.csv`.
- [x] **Merge Thai Dictionary Data:** Combine `spelling_thai_word.csv` with `thai_word_with_def.csv` into a new centralized file: `src/data/games/spelling/thai_word_spelling_game.csv`.
- [x] **Refine English Dictionary Data:** Filter out small 3-character words from `spelling_english_word.csv`.
- [x] **Cleanup:** Remove unused older CSV files like `thai_word_with_def.csv` after the successful merge.

## 3. Performance Improvements
- [x] **Concurrent Data Loading:** Use `Promise.all` in `page.tsx` for faster TTI.
- [x] **Optimize React State:** Ensure `useCallback` and `useMemo` are utilized in `FlashcardClient.tsx` to prevent unnecessary re-renders.

## 4. Code Improvements (Refactoring & Centralization)
- [x] **Extract Types:** Move `VocabularyWord` to a dedicated `types.ts` file.
- [x] **Modularize Flashcard Client:** Extract `ResultScreen.tsx`, `PlayingScreen.tsx` and `MenuScreen.tsx` from `FlashcardClient.tsx`.
- [ ] **Centralize Game Constants:** Move magic numbers to `constants.ts`.

## 5. Network Improvements
- [x] **Server Payload Optimization:** Ensure only the necessary array properties are passed to the client component.

## 6. Security Improvements
- [x] **Dataset Hiding:** Verify that the CSV files are not publicly accessible via the `public` directory or API endpoints.

## 7. Post-Review Improvements (Implementation Plan)
- [x] **Fix Duplicate Words:** Updated server-side randomizer in `actions.ts` to use Fisher-Yates partial shuffle. (v1.1.8)
- [x] **Fix Memory Leak:** Implement "Data Decoupling" to safely truncate `activeVocab` while preserving history.
- [ ] **Fix Timer Drift:** Use absolute `Date.now()` logic in `FlashcardClient.tsx` to prevent drift.
- [ ] **Refactor Prop Drilling:** Extract game logic to a custom hook (`useFlashcardGame.ts`).
- [ ] **Optimize Swipe Stutter:** Use direct DOM mutation via `cardRef` during drags for 60fps performance.
- [x] **Improve Practice UX:** (Partially done with Stopwatch) Allow dismissing hints with keyboard/overlay.
- [x] **New Feature - Stopwatch:** Show elapsed time in the HUD for all non-timer modes.
- [x] **Hygiene:** Update `.gitignore`, version bump (1.1.6), and record in `changelog.md`.
- [x] **Rename Game:** Changed folder structure, URL, metadata, and internal files from "is-it-spelled-correctly" to "spellchecker". Added 308 redirect. (v1.1.7)
- [x] **Documentation Style:** Updated `changelog.md` and `CLAUDE.md` to adopt a short but detailed changelog format and added an `UPDATE NOTE`.
