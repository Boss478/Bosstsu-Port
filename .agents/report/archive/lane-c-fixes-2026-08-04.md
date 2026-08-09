# Lane C Fixes — Task Report (2026-08-04)

Branch: `lane-c-fixes` — commit `d860c55` (based on main `6e01846`)
Files touched (all 5 in scope, nothing else): `Header.tsx`, `SettingsMenu.tsx`, `ReadingSettings.tsx`, `admin/AdminSidebar.tsx`, `games/phonics/screens/SettingsScreen.tsx`

## Changes

1. **Header read-state button functional** (`Header.tsx`)
   - Desktop + mobile theme buttons: `onClick={theme === 'read' ? () => setTheme('light') : toggleTheme}` — read mode now exits to light (per senior finding; `useTheme` provides both `setTheme` + `toggleTheme`).
   - `themeAria` now announces the **next action** (read/dark → `สลับเป็นธีมสว่าง`, light → `สลับเป็นธีมมืด`) instead of the current state. Comment updated.
   - light↔dark contract untouched (`toggleTheme` semantics unchanged).
2. **Shared `Segment`** — `export function Segment` + `export interface SegmentProps` from `ReadingSettings.tsx`; byte-identical local copy (~26 lines) deleted from `SettingsMenu.tsx`, which now imports `{ ReadingSettings, Segment }`. No behavior change.
3. **Honest display-only labels**
   - `AdminSidebar.tsx`: read-mode button title `'Read Mode'` (implied action, toggle no-ops) → `'โหมดอ่าน'` (state wording).
   - Phonics `SettingsScreen.tsx`: theme toggle label in read mode `'Read Mode'` → `'Reading Mode'` (state wording). `toggleTheme` semantics untouched everywhere.

## Behavior Contract

- Header button in read mode → switches to light; light↔dark toggle unchanged; 3-way choice remains in SettingsMenu + reading dock.
- Gear menu renders identically (same JSX, single Segment source now).
- Admin sidebar + phonics labels never imply a toggle in read mode.

## Verification Evidence

- `npx tsc --noEmit`: **clean** (after removing a stale `.next/types` artifact generated on the user's rename branch; not a code issue).
- `npm run lint`: **clean**.
- `npm run build`: **pass** (exit 0; only pre-existing warnings: `upload.ts` dynamic-require trace + metadataBase).
- Browser (shared dev server :3300, revived the existing stopped container `boss478-app-dev-1` — no second instance; left running for other agents):
  - Read → header click → light: **htmlClass `read`→`light`, localStorage `read`→`light`** (desktop 1280px, real Playwright click; AND mobile 375px — exactly one visible button, aria `สลับเป็นธีมสว่าง`, click → light).
  - light→dark→light via header button: unchanged, both viewports.
  - Header aria: light=`สลับเป็นธีมมืด`, dark=`สลับเป็นธีมสว่าง`, read=`สลับเป็นธีมสว่าง` (observed live, multiple pages).
  - Gear menu: opens; 4 segment groups (ธีม/โทนกระดาษ/ขนาดตัวอักษร/ความกว้างเนื้อหา) render from the shared Segment; selecting ธีมอ่าน → htmlClass `read`.
  - Phonics settings screen: read mode → label **`Reading Mode`**, switch off, htmlClass `read`; dark mode → label `Dark Theme`, switch on.
  - Console: no new errors (only pre-existing `POST /api/analytics 500` — salt not set, predates this work).

## Known Risks / For Senior Review

1. **Branch-safety incident (important)**: while I was browser-testing, other agents/user switched branches in this shared checkout (reflog: `lane-c-fixes → lane-d-fixes → lane-a-fix-contrast` + a reset). The user's rename commit `ee88102` (lane-a-fix-contrast, "Rename KruLAW → LawLib") **swept in my then-uncommitted changes** via `git add`. All of my changes are intact there EXCEPT the Header **mobile** button fix (its `onClick={toggleTheme}` — my mobile edit was lost in an earlier parallel-edit race and is missing from `ee88102`). My `lane-c-fixes d860c55` is complete and correct (mobile fix verified in browser at 375px). **When merging: `d860c55` is authoritative; `ee88102` carries partial duplicates of these fixes — the merge should prefer lane-c-fixes' versions and must not drop the Header mobile-button fix.** Note also `ee88102` is a massive user-driven rename (krulaw→lawlib) that is outside my scope.
2. **AdminSidebar label**: `/admin` is auth-gated (redirects to `/admin/login`); no credentials available, so the `'โหมดอ่าน'` title was verified by code review + typecheck/lint/build only. Change is a one-string ternary.
3. **Phonics verification environment**: the shared dev server was CPU/memory-saturated (106–138%, 933–1006MiB/1GiB) during most of my session (other agent's lawlib compiles + my loads). Final checks succeeded after it settled. A host `npm run build` run mid-session regenerated `.next/` with lawlib types (from the rename commit); `.next` is gitignored and was cleared; `package-lock.json` version-sync from that build was reverted (not in scope).
