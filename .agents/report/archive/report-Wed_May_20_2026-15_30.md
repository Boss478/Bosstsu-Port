# Code Centralization Report — v1.9.0

**Date:** 2026-05-20 15:30
**Version:** 1.9.0

## Summary

Full code centralization sweep across config, routes, validation, and admin CRUD operations.

## Files Created (6)
- `src/lib/routes.ts` — Route constants (ADMIN/PUBLIC paths)
- `src/lib/validation.ts` — Shared Zod field primitives
- `src/lib/admin-crud.ts` — Shared server action utilities (withAuth, handleDbError, sanitizeHtml, revalidateContentPaths, createTogglePublished, createDeleteItem)
- `src/lib/env.ts` — Centralized process.env access
- `src/hooks/useListNavigation.ts` — Shared navigation hook for public listing pages

## Files Deleted (1)
- `src/lib/constants.ts` — Merged into config.ts (DB timeouts/pool)

## Files Modified (20+)
- `src/lib/config.ts` — Added VALIDATION, REVALIDATION, PAGINATION (SIZE_OPTIONS, POLL_LIMIT, RECENT_RESOURCES), DB sections, MAX_SIZE_MB
- `src/lib/db.ts` — Uses CONFIG.DB instead of constants.ts
- `src/lib/auth.ts` — Uses getEnv() for ADMIN_TOKEN_SECRET
- `src/lib/session-code.ts` — Uses CONFIG.TOOLS.SESSION_CODE_LENGTH
- `next.config.ts` — Imports CONFIG.UPLOAD.MAX_SIZE_MB
- `src/app/admin/login/actions.ts` — Uses getEnv() for ADMIN_PASSWORD, ADMIN_TOKEN_SECRET, NODE_ENV
- `src/app/admin/page.tsx` — Uses getEnv() for MONGO_EXPRESS_URL
- `src/app/actions/admin.ts` — Uses getEnv() for MONGODB_URI
- `src/app/admin/portfolio/actions.ts` — 177→105 lines
- `src/app/admin/gallery/actions.ts` — 188→117 lines
- `src/app/admin/games/actions.ts` — 195→124 lines
- `src/app/admin/resources/actions.ts` — 262→184 lines
- `src/app/(website)/portfolio/PortfolioClient.tsx` — Uses useListNavigation
- `src/app/(website)/gallery/GalleryClient.tsx` — Uses useListNavigation
- `src/app/(website)/games/GamesClient.tsx` — Uses useListNavigation
- `src/app/(website)/resources/ResourcesClient.tsx` — Uses useListNavigation
- `src/components/admin/PageSizeSelector.tsx` — Uses CONFIG.PAGINATION.SIZE_OPTIONS
- `src/app/api/tools/poll/route.ts` — Uses CONFIG.TOOLS.PAGINATION.TOOLS_PUBLIC
- `src/app/(website)/resources/[id]/page.tsx` — Uses CONFIG.PAGINATION.RECENT_RESOURCES
- `src/app/admin/tools/actions.ts` — Fixed English error message to Thai

## Verification
- ✅ ESLint passes
- ✅ Next.js build passes
- ✅ Dev server running
