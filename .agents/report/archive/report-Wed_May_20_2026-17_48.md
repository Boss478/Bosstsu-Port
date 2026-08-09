# Report: Rate Limit Config Refactor

**Date:** 2026-05-20 17:48 (ICT)
**Version:** 1.8.23

## Changes
- `src/app/api/tools/poll/route.ts`: `entry.count >= 5` → `entry.count >= CONFIG.TOOLS.RATE_LIMIT_PER_MINUTE`
- `src/app/api/tools/respond/route.ts`: Same
- `src/lib/config.ts`: `RATE_LIMIT_PER_MINUTE: 5` → `10`

## Verification
- `npm run build` passed ✓
- `CONFIG` already imported in both route files
