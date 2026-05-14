# Boss478 Project Memory

## Bugs / Errors / Patterns

### Number Game Double-Click Bug (2026-05-14)
- **Issue**: Answer buttons were clickable during 1-second transition after correct/wrong answer, allowing double-clicks to register incorrect answers
- **Fix**: Added `isTransitioning` state + disabled attribute on buttons during transition
- **Location**: `src/app/(website)/games/number-game/NumberGameClient.tsx`
- **Pattern**: For any game/quiz with timeouts between questions, always block button clicks during transition

---

## Project Context

- Version: 1.5.26
- Tech: Next.js 16, TailwindCSS 4, MongoDB
- Dev server: http://localhost:3300
- Admin routes protected by JWT middleware