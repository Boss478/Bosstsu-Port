# Post-mortem: Game hydration mismatch — localStorage lazy initializers in SSR'd pages

- **Date:** 2026-07-31
- **Version:** v1.10.72
- **Owner:** boss478
- **Affected routes:** `/games/alphabet-adventure`, `/games/alphabet-adventure/beta`, `/games/number-game`

## 1. Summary

The three game pages threw `Hydration failed because the server rendered HTML didn't match the client` on every load that had any saved progress (high score, card count, map progress, or per-range best). React regenerated the tree on the client, discarding SSR. Fixed by rendering the game clients exclusively client-side via `'use client'` shells using `next/dynamic(..., { ssr: false })` (`AlphabetAdventureShell.tsx`, `AlphabetAdventureBetaShell.tsx`, `NumberGameShell.tsx`), which removes the entire divergence class rather than patching individual reads.

## 2. Symptom

Dev-server console on page load with saved progress:

```
Hydration failed because the server rendered HTML didn't match the client.
As a result this tree will be regenerated on the client.
...
    at MenuScreen (src/app/(standalone)/games/alphabet-adventure/screens/MenuScreen.tsx:156:11)
    at AlphabetAdventureClient (src/app/(standalone)/games/alphabet-adventure/AlphabetAdventureClient.tsx:333:11)
```

The diff: client rendered `<div className="inline-block bg-violet-100 ...">` (Best Score block, `MenuScreen.tsx:154-161`) where the server had `<div className="flex items-center justify-center gap-4">` (the badges container, `MenuScreen.tsx:163`).

## 3. Root cause

Client-only state was read in `useState` lazy initializers and the result **gated SSR-visible DOM output**:

- `MenuScreen.tsx:30-36` — `highScore` from `alphabet-adventure-highscore` gates the Best Score block (`:154`).
- `MenuScreen.tsx:38-41` — `cardCount` from `loadCollection()` gates the Cards badge (`:164`).
- `useGameActions.ts:93-97` — `hasSavedProgress` from `loadMapSave()` gates the Progress badge (`MenuScreen.tsx:172`) via `hasProgress` (`AlphabetAdventureClient.tsx:335`).
- `(website)/games/number-game/screens/RangeScreen.tsx:13-21` — `highScores` from `localStorage` gates the `Best: N` lines (`:41-45`).

On the server, `typeof window === 'undefined'` returns the default (0 / false / `{}`), so those blocks are absent from SSR HTML. During hydration the lazy initializer runs again and reads the real stored value. When it differed from the default, the client inserted/removed DOM nodes at a position the server had filled with a sibling element — hence the exact diff (`Best Score block` vs the `:163` badges container).

The pattern was actively recommended by `AGENTS.md` ("Use lazy state initializers (`useState(() => ...)`) for localStorage loads"), which is why it was applied uniformly.

## 4. Why it produced the symptom

Server: `highScore = 0` → `{highScore > 0 && ...}` renders nothing → SSR emits the badges container as the first element after the two blurb `<p>`s.
Client: `highScore = 100` → renders the Best Score block → the first element after the blurb `<p>`s is now a different `<div>` with different children.
React compares the hydrated DOM to the client tree at the same index and reports the className/children divergence. It then throws away the SSR tree and re-renders. Deterministic for any user with progress — i.e., any returning kid, which is the entire target audience.

## 5. Fix

**PR scope: 3 new files + 3 page edits + docs.**

Each game page is a Server Component because it exports `metadata`. Next.js 16 forbids `ssr: false` with `next/dynamic` inside a Server Component (build error: "`ssr: false` is not allowed with `next/dynamic` in Server Components. Please move it into a Client Component"). So each route got a thin `'use client'` shell that owns the dynamic import:

```
page.tsx (server)  →  *Shell.tsx ('use client')  →  next/dynamic(..., { ssr: false })  →  game client
```

- `src/app/(standalone)/games/alphabet-adventure/AlphabetAdventureShell.tsx` (new)
- `src/app/(standalone)/games/alphabet-adventure/beta/AlphabetAdventureBetaShell.tsx` (new)
- `src/app/(website)/games/number-game/NumberGameShell.tsx` (new)
- The three `page.tsx` files now import and render their shell; `metadata` and `dynamic = 'force-dynamic'` unchanged.
- Loading fallback preserved: `<div className="min-h-screen bg-slate-950 animate-pulse" />`.

Why this fixes the root cause: with `ssr: false`, the server emits only the shell's loading fallback — no game-client HTML exists to mismatch during hydration. This kills the whole class (current *and* future `useState(() => localStorage...)` reads in the game), not just the four known instances. Side benefit: menu rendering moves off the 1-vCPU server.

## 6. How it was found

- **Repro:** play one round (writes `alphabet-adventure-highscore`), hard-reload `/games/alphabet-adventure` → hydration error, deterministic. Reported via Next.js hydration-mismatch error with component stack.
- **Trace:** the error diff itself identified the divergence — server's `flex items-center justify-center gap-4` is the badges container at `MenuScreen.tsx:163`, proving the server skipped the Best Score block. Grep for `useState(() =>|localStorage.getItem` across `src/` enumerated every client-only value gating render output.
- **Hypotheses rejected:** stale `.next` build cache (previously the cause of a similar-looking mismatch — see memory) — rejected because the server HTML's classes match current source; only the block presence differs, which is consistent with value divergence, not stale markup.
- **Confirming experiment:** the `+`/`-` diff shows presence/absence of the localStorage-gated block — exactly the mechanism; no other divergence in the tree.
- **First fix attempt failed at build:** applying `ssr: false` directly in the page Server Components was rejected by the Next.js 16 compiler. This produced the second breadcrumb: the shell-indirection pattern, which the codebase already uses (`PhonicsClient.tsx:54-67`, `LearningForm.tsx:15`).

## 7. Why it slipped through

- **Latent code:** lazy initializers for localStorage are the sanctioned pattern in this project (`AGENTS.md` guidance) and are harmless in client-only trees. They only become bugs when the hosting page is SSR'd with `metadata` — which these game pages were, silently, because `next/dynamic` without `ssr: false` still SSR's.
- **Workload gap:** a fresh user (no progress) never diverges — server and client both render no badges. The mismatch only fires for returning users, which may not have been exercised during the game's standalone-layout migration (changelog v1.10.71 era).
- **CI gap:** no hydration-aware test (Playwright console-error assertion on game routes). The build cannot catch hydration mismatches (server and client compile separately).

## 8. Validation

- `npm run build` passes clean (Next.js 16 production build; all three routes compile: `/games/alphabet-adventure`, `/games/alphabet-adventure/beta`, `/games/number-game`).
- `npx tsc --noEmit` and ESLint pass on all 6 changed source files.
- **Structural validation:** with `ssr: false`, no game-client HTML is emitted server-side, so the reported mismatch is impossible by construction.
- **Not yet done:** live browser check (dev server) of a returning-progress user, and Playwright console-error assertion. The working tree currently has unrelated WIP (tools refactor) that pre-existing lint/typecheck errors belong to — not this change.

## 9. Action items / follow-ups

- **Playwright regression test:** assert no console error on `/games/alphabet-adventure` load with `alphabet-adventure-highscore` preset in localStorage. (Owner: boss478, next session.)
- **Live manual check:** dev-server reload with saved progress; confirm zero console errors and badges render. (Owner: boss478, next session.)
- **AGENTS.md:** guidance updated (lazy initializers only in client-only trees; `ssr:false` shells for interactive pages; `npm run typecheck` → `npx tsc --noEmit`). Not committed per request.
- **Related, not touched:** `src/hooks/useLocalStorage.ts:9-17` uses the same lazy-init pattern (currently unused) — same class; delete or migrate if ever adopted.
