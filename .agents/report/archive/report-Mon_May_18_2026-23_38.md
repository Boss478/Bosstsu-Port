# Report: WebP Support + VPS Permission Fixes

**Date:** 2026-05-18 23:38  
**Version:** v1.8.9 → v1.8.9 (deployed)  
**Task:** WebP image support + fix 404 errors on VPS uploads

---

## What Was Done

### 1. WebP Auto-Detection in saveFile()
- Added `FOLDERS_CONVERT_TO_WEBP` config mapping folder → boolean
- `saveFile()` now detects source MIME type automatically:
  - `image/webp` → stays WebP (no re-encoding needed)
  - `image/png` → converted to WebP
  - `image/jpeg` → converted to WebP
  - Other types → kept as-is
- Quality reduced from 80 → 75 for both JPEG and WebP

### 2. WebP Folders Config
- `uploads/games` → WebP ✓
- `uploads/gallery/covers` → WebP ✓
- `uploads/learning` → WebP ✓
- `uploads/portfolio` → JPEG (keep JPEG)
- `uploads/gallery/albums` → JPEG (keep JPEG for photo albums)
- `uploads/tools`, `uploads/misc` → JPEG

### 3. VPS Permission Fixes

**Problem 1:** `.next/server` built as root → files owned by root → Next.js running as nextjs (uid 1001) couldn't serve them
- **Fix:** `dockerfile` runner stage now `chown -R 1001:1001 /app` after COPY

**Problem 2:** Sharp image cache write failure → partial route failures
- **Fix:** Pre-create `/app/.next/cache` with correct ownership in Dockerfile

**Problem 3:** `.webp` files from volume (0644) vs built-in COPY (0755) caused Next.js 404 mismatch in internal manifests
- **Fix:** Added `entrypoint.sh` that normalizes all upload file permissions to 644 on every container start
- `docker-compose.yml` added `user: "1001:1001"` so named volumes mount as nextjs

**Problem 4:** Uploaded files with `0644` were readable but Next.js internal file matching treated them differently than `0755` built-in files
- **Fix:** `entrypoint.sh` ensures consistent permissions across all upload files

---

## Files Changed
- `src/lib/upload.ts` — WebP auto-detection + quality reduction
- `src/lib/config.ts` — FOLDERS_CONVERT_TO_WEBP mapping
- `dockerfile` — chown + entrypoint
- `entrypoint.sh` (new) — permission normalization script
- `docker-compose.yml` — user: 1001:1001
- `package.json` — version bump to 1.8.9
- `changelog.md` — updated

## Deployment
- Successfully deployed to VPS via `git pull && snip docker compose up -d --build`
- All URLs return HTTP 200:
  - `/` home
  - `/games`
  - `/uploads/games/2026/05/*.jpg`
  - `/uploads/games/2026/05/*.webp`
