# Report — UX Standardization Public Listing Pages (v1.8.19)

**Date:** 2026-05-20 15:10
**Version:** 1.8.19

## Objective
Standardize filter, sort, pagination, and empty state patterns across all 4 public listing pages (portfolio, gallery, resources, games).

## Scope — 3 Phases

### Phase 1 — Games Pagination
- Added `GAMES_PUBLIC: 15` to `src/lib/config.ts`
- Rewrote `src/app/(website)/games/page.tsx` with server-side pagination (skip/limit, countDocuments, distinct categories)
- Rewrote `src/app/(website)/games/GamesClient.tsx` with category button pills, sort select, NavigationPendingBar, Pagination, EmptyState
- Replaced client-side text search with server-side category filter

### Phase 2 — Standardization
- **Portfolio:** Tag `<select>` → button pills, sort toggle → `<select>` dropdown
- **Gallery:** Same as portfolio
- **Resources:** Inline empty state → shared `<EmptyState>` component

### Phase 3 — Polish
- Added total count display on all 4 pages ("ทั้งหมด N รายการ")
- Added scroll-to-top on page change via Pagination useEffect
- Passed `total` prop from server to client components

## Files Changed (10)

| File | Change |
|------|--------|
| `src/lib/config.ts` | Added GAMES_PUBLIC: 15 |
| `src/app/(website)/games/page.tsx` | Server-side pagination, searchParams handling |
| `src/app/(website)/games/GamesClient.tsx` | Button pills, select sort, Pagination, EmptyState |
| `src/app/(website)/portfolio/page.tsx` | Button pills, select sort, total prop |
| `src/app/(website)/portfolio/PortfolioClient.tsx` | Migrated from select/toggle to pills/select |
| `src/app/(website)/gallery/page.tsx` | Button pills, select sort, total prop |
| `src/app/(website)/gallery/GalleryClient.tsx` | Migrated from select/toggle to pills/select |
| `src/app/(website)/resources/page.tsx` | EmptyState, total prop |
| `src/app/(website)/resources/ResourcesClient.tsx` | Inline empty → EmptyState |
| `src/components/Pagination.tsx` | Added scroll-to-top useEffect |
| `src/models/Game.ts` | Exported IGame interface |

## Lint Fixes
- Removed unused `Link` import in GamesClient.tsx
- Replaced `any` with `IGame` type
- Removed unused `defaultFallbackDate`
- Exported `IGame` interface from Game.ts

## Verification
- ESLint clean on all modified files
- `npm run build` passed

## Standardized Pattern (All 4 Pages)

| Feature | Pattern |
|---------|---------|
| Filter | Button pills (overflow-x-auto, active = blue bg + white text) |
| Sort | `<select>` dropdown (ใหม่สุด / เก่าสุด) |
| Pagination | Shared `<Pagination>` component with scroll-to-top |
| Empty State | Shared `<EmptyState>` component |
| Total Count | Displayed in header ("ทั้งหมด N รายการ") |
| Pending | NavigationPendingBar + opacity dim on grid section |
| Grid | 3-4 column responsive grid |
