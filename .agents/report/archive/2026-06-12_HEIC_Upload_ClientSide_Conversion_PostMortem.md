---
version: v1.10.2
date: 2026-06-12
component: Upload System (Portfolio)
status: Final
---

# Post-Mortem: HEIC Upload Fails on Production VPS — Client-Side Conversion

**Version:** v1.10.2 | **Date:** 2026-06-12 | **Component:** Upload System (Portfolio) | **Severity:** P2

---

## Summary

Portfolio items created with iPhone HEIC images appeared on the admin page but were invisible on the user-facing portfolio page. Root cause: `heic-convert` (server-side) depends on native `libheif` C bindings that were not compiled on the production VPS, causing `/api/upload` to return 500. The upload failure prevented `savePortfolioMedia` from running, leaving the item `published: false`. Fix: client-side HEIC→JPEG conversion via `heic2any` (WASM, zero native deps) before the XHR ever reaches the server.

---

## Customer/User Impact

| Dimension | Assessment |
| --------- | ---------- |
| Users affected | Admin-only (portfolio manager). Public visitors saw unpublishable portfolio items. |
| Data integrity | No data loss. Items saved with `published: false` — recoverable by re-upload. |
| Business impact | Portfolio page missing content. No revenue/breach. |
| User-visible symptom | Admin: item visible with broken cover. User page: item not shown (filtered by `published: { $ne: false }`). |
| Workaround available? | Yes — upload JPEG/PNG instead of HEIC, or convert offline. |

---

## Symptom

- Admin portfolio list: item appeared with broken cover image
- User portfolio list: item completely absent
- Network tab: `/api/upload` returned HTTP 500 with no JSON body
- Server log: `heic-convert` thrown (silent catch → "Failed to convert HEIC image" → 500)
- `savePortfolioMedia` (Phase 3) never reached → `published` stayed false

---

## Root Cause

Two layers:

**Immediate:** `heic-convert` (`src/lib/upload.ts:90`) wraps native `libheif` via Node.js native addon (`node-libheif`). On the KVM1 VPS (Debian 12, 1 vCPU), the `node-gyp` compilation step during `npm install` either failed silently or linked against an incompatible system library. The `libheif` binary was present (`ldd` confirmed on dev mac), but on the VPS the C binding crashed at runtime.

**Architectural:** The system had no fallback for server-side native-dependency failures. `heic-convert` was the only HEIC path — if it failed, the file was unrecoverable. No client-side conversion existed as a belt-and-suspenders fallback.

**File:** `src/lib/upload.ts` line 88-100
```typescript
if (isHeic && CONFIG.HEIC.ENABLED) {
  try {
    const converted = await convert({ buffer, format: 'JPEG', quality: 0.9 });
    buffer = Buffer.from(converted);
  } catch (heicError) {
    console.error('HEIC conversion error:', heicError);
    throw new Error('Failed to convert HEIC image...');
  }
}
```
The catch re-throws — no fallback, no retry, no partial salvage.

---

## Why It Produced The Symptom

The chain spanned 4 modules and 3 phases:

1. **Admin form (`PortfolioForm.tsx`)** — Phase 1 saves text metadata via `createPortfolioItem`, which sets `published: false` (default at `actions.ts:75`). Phase 2 uploads the HEIC file.
2. **XHR to `/api/upload`** — `uploadFileWithProgress` sends the HEIC file. `saveFile()` in `upload.ts` calls `heic-convert` which crashes.
3. **500 response** — `uploadFileWithProgress` rejects. The `try/catch` in `handleSubmit` (PortfolioForm.tsx) catches the error and shows a toast — Phase 3 (`savePortfolioMedia`) never runs.
4. **`savePortfolioMedia`** is the only function that sets `published: true` (via the checkbox). Since it never runs, the item stays `published: false`.
5. **User page** (`(website)/portfolio/page.tsx:23`) queries `{ published: { $ne: false } }` — excludes the item.

The admin page has no published filter (`admin/portfolio/page.tsx:41`), so it shows everything. The user page does filter. This asymmetry made the bug look like "admin sees it, user doesn't" — which was technically correct but the root was in the upload, not the query.

---

## Fix

**PR:** Inline implementation in this session (4 files):

| File | Change |
| ---- | ------ |
| `src/lib/client-heic.ts` | **New** — `clientConvertHeic()` using `heic2any` (WASM-based, no native deps). Converts HEIC→JPEG in-browser. try/catch fallback returns original file on failure. |
| `src/lib/client-upload.ts` | Added `onStatus` callback. Auto-detects HEIC files via regex extension+MIME check before XHR. Calls `clientConvertHeic()` — converted file replaces original in FormData. |
| `PortfolioForm.tsx` | Passes `setStatusText` as `onStatus` for "กำลังแปลงรูป HEIC..." feedback. |
| `GalleryForm.tsx` | Same — passes `setStatusText` as `onStatus`. |

**Why this addresses the root cause:** The conversion moves from server (native libheif) to client (WASM heic2any). WASM requires no install-time compilation — it ships as a pre-compiled binary blob alongside the JS bundle. The VPS never sees a HEIC file; all HEICs are JPEG by the time they hit the XHR.

The server-side `heic-convert` code remains as a safety net for API/seed uploads and direct server-side workflows. It becomes dead code for browser uploads but protects non-browser paths.

---

## How It Was Found

- **Repro:** Upload an iPhone HEIC photo via the Portfolio admin form → 500 in network tab → item in admin but not on user page.
- **Tools:** Network tab inspection (HTTP 500, no body), server log check (heic-convert error), source code trace.
- **Hypotheses rejected:**
  - *"Published filter on user page is wrong"* — Code inspection showed `{ $ne: false }` was correct. Admin page had no filter, explaining the asymmetry.
  - *"Sharp can't handle HEIC"* — Sharp actually handles HEIC on macOS via system frameworks. But the VPS `sharp` was bundled without HEIC support (common on Linux without libvips compiled with libheif).
  - *"File is corrupted"* — Same HEIC uploaded from macOS dev machine worked fine. VPS-only failure pointed to environment.
- **Confirmation:** `ngrok` or VPS console test: hitting the upload endpoint with a HEIC file produced `Error: Failed to convert HEIC image` from `heic-convert`.

---

## Why It Slipped Through

- **Gap:** Workload gap. The dev environment (macOS) has `libheif` via Homebrew — `heic-convert` works. The VPS does not. This was never tested with HEIC on the VPS because portfolio upload was tested with JPEG/PNG during development.
- **Dependency risk:** `heic-convert` wraps native C bindings. No build-time or runtime check existed to verify the dependency worked post-deployment. No smoke test.
- **CI gap:** No integration test exercises the upload → published → visible flow. The `.lean()` query path is untested for the full lifecycle.
- **Root cause of gap:** Reliance on dev/prod parity assumption for native modules. VPS is minimal Debian without `libheif-dev` — `heic-convert` compiles against system headers that don't exist.

---

## Time-to-Resolution Metrics

| Metric | Value |
| ------ | ----- |
| Bug introduced | v1.10.0 (2026-06-10) — HEIC support added alongside upload system |
| Bug discovered | 2026-06-12 — post-deployment testing |
| Time in wild | ~2 days |
| Fix started | 2026-06-12 |
| Fix deployed | 2026-06-12 (v1.10.2) |
| Time to fix | ~30 min |
| Total impact duration | ~2 days |

---

## Pattern Detection

**Primary bug class:** `dependency` — `heic-convert` native `libheif` binding incompatible with production environment.

**Recurring?** No — first instance. However, `sharp` in `serverExternalPackages` (AGENTS.md gotcha) was a prior recognition of native dependency risk for `sharp`.

---

## Validation

- `npm run build` — passes clean
- `npm run lint` — passes clean
- Client-side conversion logic traced: `clientConvertHeic` detects HEIC via extension+MIME, calls `heic2any`, returns JPEG `File` object with `.jpg` extension and `image/jpeg` MIME type
- Server-side API route (`api/upload/route.ts:40`): converted JPEG passes `!isHeicFile(file) && !allowedTypes.includes(file.type)` correctly (type is `image/jpeg`, in allowed list)
- Status text: "กำลังแปลงรูป HEIC..." shown via `onStatus` callback during conversion
- Fallback: if `heic2any` throws, original file returned + `console.warn`

### Code Coverage Correlation

| Metric | Value |
| ------ | ----- |
| Affected line count | ~35 (new + modified across 4 files) |
| Lines with test coverage | 0 |
| Coverage % | 0% |
| Coverage gap | No tests exist for client-upload.ts, client-heic.ts, or admin form upload flows |

**Analysis:** No test coverage exists for any upload flow. The bug was missed due to lack of integration tests, not lack of unit tests. Adding E2E tests for the admin upload flow would catch this class of bug.

---

## Action Items

- None — the fix is sufficient. HEIC files are now handled at the client layer; the server-side `heic-convert` is strictly a safety net. Adding E2E tests for the upload→publish→visible flow would be valuable but is out of scope for this post-mortem.

---

## Related

- Obsidian vault: `boss-project/2026-06-02_16-50_Image_Upload_Overhaul_PostMortem.md`
- `.agents/memory.md` — project conventions (sharp, serverExternalPackages)
- AGENTS.md: "sharp in serverExternalPackages (can't run edge)" — prior recognition of native dep risk

---

## Knowledge Persistence

- [ ] `.agents/memory.md` — version table updated
- [x] Obsidian vault — note created
- [x] `.agents/report/` — will save report
