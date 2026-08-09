# Report: Student Token Persistence + IP Audit

**Date:** 2026-05-20 17:37 (ICT)
**Version:** 1.8.22
**Task:** Strategy 4 — localStorage + IP for rate limiting + IP stored for audit

## Changes Made

### 1. `src/lib/client-token.ts`
- Changed `sessionStorage` → `localStorage` (lines 3, 6)
- **Why:** Fixes tab isolation bug — students opening tools in multiple tabs now share one token

### 2. `src/models/ToolResponse.ts`
- Added `ip?: string;` field to interface
- Added `ip: { type: String }` to schema
- Added index `{ sessionId: 1, ip: 1 }`

### 3. `src/app/api/tools/poll/route.ts`
- Added `getClientIp()` helper function
- Rate limit key changed from `${sessionId}:${studentToken}` to `${sessionId}:${ip}:${studentToken}`
- Passes `ip: getClientIp(req)` to `ToolResponse.create()`

### 4. `src/app/api/tools/respond/route.ts`
- Same pattern as poll route

### 5. `src/components/admin/ResultsView.tsx`
- Added IP column to assignment results table (hidden on mobile, visible on lg+)

## Verification
- `npm run build` passed ✓
- No TypeScript errors
- Backward compatible — existing ToolResponse documents work fine (ip field is optional)

## Version & Changelog
- package.json: 1.8.21 → 1.8.22
- changelog.md updated with v1.8.22 entry
