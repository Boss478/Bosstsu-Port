# Task Report: Warm paper tone truly yellow (lane-fix-warm-yellow)

Date: 2026-08-04 · Branch: `lane-fix-warm-yellow` · Commit: `97c59ef` (not pushed)

## Task

Make the Warm (เหลือง) read-mode paper tone actually yellow — page background AND all cards (lawlib-toc, lawlib-article-card, panels, dock, list cards, digest cards), cards slightly lighter/creamier than the bg. Scope: ONLY the warm tone variable block in `src/app/globals.css`.

## Exact Diff

```diff
 html.read[data-paper-tone='warm'] {
-  --read-bg: #f6efd9;
-  --read-card: #fdf6e3;
+  --read-bg: #f9ecc0;
+  --read-card: #fdf5cf;
 }
```

`git diff --stat`: 1 file changed, 2 insertions(+), 2 deletions(-). No other files touched.

## How One Edit Covers Everything

- Page bg: `:root.read { --background: var(--read-bg) }` (globals.css:168) → new `#f9ecc0`.
- All six card types inherit via the existing rule at globals.css:1449-1458 (`.read .lawlib-article-card, .lawlib-toc, .lawlib-panel, .lawlib-dock, .lawlib-list-card, .lawlib-digest-card { background: var(--read-card); ... }`) → new `#fdf5cf`, one tone lighter than bg.
- Soft/classic tone blocks untouched. Card rules untouched.

## Contrast Verification (computed, WCAG relative luminance)

| Pair | Ratio | Pass (≥4.5) |
| --- | --- | --- |
| ink #3a2f1f vs bg #f9ecc0 | 11.07:1 | ✓ |
| ink #3a2f1f vs card #fdf5cf | 11.91:1 | ✓ |
| muted #7a6845 vs bg #f9ecc0 | 4.57:1 | ✓ |
| muted #7a6845 vs card #fdf5cf | 4.92:1 | ✓ |

Luminances: bg 0.8394 (≈0.84), card 0.9069 (≈0.91). Constraint check: muted 4.57:1 on bg is just above the 4.5 threshold — consistent with "bg luminance must stay ≥ ~0.826" (at 0.826 exactly, muted = 4.50). This is indeed the max yellow saturation that keeps #7a6845 compliant.

## Verification Evidence

- `grep -n "data-paper-tone='warm'" -A 3 src/app/globals.css` → `#f9ecc0` / `#fdf5cf` ✓
- `git diff --stat` → 1 file, 2 lines ✓ (full patch shown above)
- `npm run typecheck` → **clean** ✓
- Visual check: **NOT fully achieved** (see below) — static + math evidence stands in per task instructions.

## Visual Check Attempt (honest account)

1. Reused the shared dev container `boss478-app-dev-1` (port 3300) — did NOT start my own. Navigated to /lawlib, opened settings, confirmed read mode active (อ่าน pressed), clicked โทนกระดาษเหลือง. `data-paper-tone="warm"` + `.read` applied to `<html>`; computed styles showed **stale** values (`--read-bg: #f6efd9`, `--read-card: #fdf6e3`) — exactly the known broken-inotify watcher symptom.
2. Restarted container per instructions (`docker compose --profile dev restart app-dev`). `docker exec` confirmed the bind-mounted `/app/src/app/globals.css` HAS the new values (#f9ecc0/#fdf5cf), but the served CSS chunk (`/_next/static/chunks/src_1wx7p3a._.css`) still contained the OLD values — the `.next` named volume persists compiled output across restarts, and with the watcher broken the server never invalidates it.
3. Attempted the cache-clear workaround (`rm -rf /app/.next` + restart) but **Docker Desktop went down mid-attempt** (docker.sock disappeared, no daemon, no Desktop process). Starting Docker Desktop is outside my lane (devops owns infra; task said reuse the existing container only), so I stopped there.
4. **Container restarts performed: one** (app-dev restart). The subsequent `rm -rf`/restart did NOT execute (daemon down). **Note for devops/next session: dev container's `.next` volume may need clearing to serve fresh CSS; Docker Desktop needs to be relaunched.** No data loss — `.next` is generated build output in a dev-only named volume; repo untouched.

Per the task's explicit fallback: "if you can't get a clean visual, the grep + contrast math is sufficient evidence" — this is that case, stated honestly.

## Known Risks / For Senior Review

- Visual confirmation pending (dev-server cache staleness + Docker Desktop down). The change itself is a 2-line CSS variable swap with verified contrast; rendering risk is minimal since the inheritance paths were confirmed by reading the actual rules.
- `#fdf5cf` vs `#f9ecc0` differ by ~0.067 luminance — cards are clearly distinguishable from bg, both clearly yellow vs the old near-white `#fdf6e3`.
- Muted text 4.57:1 on bg is close to threshold (0.07 margin) — by design (max saturation bound); flag if the brand wants more yellow headroom, which would require darkening #7a6845.
