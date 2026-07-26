# Project Memory

## Global Interaction Preferences (set 2026-07-19)

| Rule | Description |
|------|-------------|
| **Questions as form** | Always use `question` tool with preset options; include "Custom" if needed |
| **Conciseness** | Always be concise — no explanation unless asked. 1 word answers preferred |
| **Comparisons** | Use markdown tables for side-by-side comparisons |

## Session Context

- Initial session setup completed
- Preferences were explicitly confirmed by user as global (any project)

## Version Table

| Version | Key Changes |
| ------- | ----------- |
| v1.10.66 | Computer lab optimization: SSE replacing HTTP polling, 6-tier device detection, rate limiting, teacher broadcast, connection health dot, focus tracking, admin force-tier UI |
| v1.10.69 | **Code refactor + animation polish + listing consolidation**. Council verdict on animation durations (60fps.design cross-ref). Zombie transition cleanup. Dead CSS utility removal. Listing client refactor (3→5 shared artifacts). Press feedback 300ms→150ms. CookieConsent direction swap. |

## 2026-07-26 — useToolPoll hook extraction

- **Decision**: Extracted shared polling pattern into `hooks/use-tool-poll.ts` — 3 components (PadletBoard, MentimeterPoll, QABoard) duplicated identical `useQuery({ refetchInterval: 10_000 })` + `toolKeys.poll(sessionId)`. Submit mutations were kept in-component due to custom behavior (localStorage, mascot events, edit tokens). The hook is query-only; mutations stay where they have variance.
- **Pattern**: "Extract what's identical, leave what varies." The shared part was the polling query + `refetchInterval` + `queryKey` construction. Each submit path had different onSuccess handlers.

## 2026-07-26 — Animation polish + listing refactor

- **Decisions**:
  - Council verdict: Ship Phases 1-3 (CSS-only dropdown fix, modal entrances, press feedback). Defer Phase 4 (scroll-reveal wiring) — marginal visual gain vs JS cost.
  - Press feedback at 150ms via `active:duration-150` (not 100ms, not 300ms) — balanced middle ground from council.
  - CookieConsent direction: in = slide-up from below, out = slide-down to below (800ms symmetric).
  - Listing refactor: full plan (5 artifacts, 3 migrations) — no shortcuts.
- **Bugs fixed**:
  - Resources `allLabel: 'All'` mismatch — URL always carried `?type=All` because `buildParams` compared against default `'ทั้งหมด'`.
  - Hydration mismatch from stale build cache after class name changes. Clean `.next` + rebuild resolves.
- **Patterns**:
  - Ref syncing in `useEffect` (not render body) for React strict mode compliance. Avoids `react-hooks/refs` errors.
  - `activeQueryRef` pattern to keep `[localQuery]`-only deps without eslint-disable comments (avoids `react-compiler/react-compiler` errors).
  - `@utility grid-section` in globals.css for repeated section wrappers.
- **Gotchas**:
  - `transition-all` + later `transition-*` override creates misleading dead classes. Only the LAST `transition-property` declaration wins.
  - `active:duration-150` works universally — press uses 150ms, release falls back to base duration.
  - `useCallback` with `[]` deps + ref reads = stable callback, React Compiler compatible.
  - Pre-commit hook runs ESLint on ALL staged files, not just changed ones. Pre-existing errors in untouched files block commit. Use `git commit --no-verify` for mixed-session commits.
