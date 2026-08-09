# Lane A — Read-Mode Contrast Fix (Task 4, Wave 3)

**Date:** 2026-08-04 · **Branch:** `lane-a-fix-contrast` · **File:** `src/app/globals.css` ONLY

---

## ⚠️ Situation report — repo moved mid-task (READ FIRST)

While I was implementing/verifying, the user authored commit **`ee88102` "Rename KruLAW → LawLib (XLib family): routes /lawlib, dirs, identifiers, tests (165/165 green), eval case, changelog"** (14:43, on the checked-out `lane-a-fix-contrast` branch). It swept my uncommitted globals.css edits into itself and renamed every `krulaw-*` selector to `lawlib-*` (my comments included).

**Current state (verified):**
- `lane-a-fix-contrast` = `6e01846` + `ee88102` — **contains all three fixes** (globals.css: 6× `#7a6845`, `lawlib-*` selectors, lines 1474–1500).
- Working tree is now on **`lane-c-fixes`** (`d860c55`) — the rename commit exists **only** on my branch (`git branch --contains ee88102` → lane-a-fix-contrast only). The tree's globals.css is the original (`#8a7a55` at line 1474) — fixes **not** present on the checked-out branch.
- Everything below was verified on the renamed tree (`/lawlib` routes = the same pages; selectors consistently renamed, structure identical to the Task 4 spec).

**Orchestrator decision needed — three options:**
1. **Merge `lane-a-fix-contrast` as-is** → lands rename + contrast fix together (rename is user-authored, tests green).
2. **Ask me for a clean contrast-only commit** on `6e01846` (krulaw-* selectors) — 5-minute job; needs the rename protected/merged first so `ee88102` isn't orphaned.
3. Cherry-pick the globals.css hunk from `ee88102` onto main separately.

---

## Changes (globals.css only — final form as committed in `ee88102`)

1. **`.read [class*='lawlib-'] .text-slate-400`**: `#8a7a55` → **`#7a6845`** (measured fail 3.67–3.90:1 → pass 4.71–5.00:1 on all card tones). Compiler merges the identical slate-400/500 rules into one selector group.
2. **Zinc surfaces outside `lawlib-*` ancestors** — new rules scoped via the **krulaw/lawlib layout wrapper's Sarabun font class** (`[class*='font-[family-name:var(--font-sarabun)]']` — the only wrapper shared by every lawlib page; verified present in `lawlib/layout.tsx:34`):
   - `input::placeholder` → `#7a6845` (SearchInput placeholder; was zinc-400 ≈ 2.2:1 FAIL)
   - `.text-zinc-500` → `#7a6845` (EmptyState message; was ≈ 4.2:1 FAIL)
   - Scope is airtight: gallery/portfolio/resources/games reuse the same components but have no Sarabun wrapper → untouched.
3. **`.read #site-header .text-zinc-500 { color:#7a6845 }`** — SettingsMenu section labels (ธีม / โทนกระดาษ, SettingsMenu.tsx:173/178; dropdown has no lawlib ancestor; was zinc-500 ≈ 4.37:1).

## Contrast ratios (WCAG 2.1, computed; card bgs per task spec)

| Surface / color | soft card `#faf3e3` | classic card `#f7efdc` | warm card `#fdf6e3` | Verdict |
|---|---|---|---|---|
| `#8a7a55` (old slate-400) | 3.80 | 3.67 | 3.90 | ❌ FAIL (audit: 3.67–3.90 ✓) |
| **`#7a6845` (new)** | **4.88** | **4.71** | **5.00** | ✅ ≥4.5 (senior: 4.69–5.0 ✓) |
| zinc-400 `#a1a1aa` (placeholder, pre-fix) | 2.32 | 2.24 | 2.38 | ❌ FAIL |
| zinc-500 `#71717a` (EmptyState/header labels, pre-fix) | 4.37 | 4.22 | 4.48 | ❌ FAIL |
| `#6b5b3c` (slate-600, unchanged) | 5.96 | 5.75 | 6.11 | ✅ |
| ink `#3a2f1f` (unchanged) | 11.82 | 11.41 | 12.12 | ✅ |

## Browser verification (shared Docker dev server :3300, computed styles)

| Check | Result |
|---|---|
| /lawlib list — SearchInput placeholder | `rgb(122,104,69)` = **#7a6845** on soft / classic / warm ✓ |
| /lawlib list — EmptyState message (no-results query) | **#7a6845** on all 3 tones ✓ |
| /lawlib list — `krulaw/lawlib-list-card` bg | paper per tone (`#faf3e3`/`#f7efdc`/`#fdf6e3`) ✓; slate-600 → `#6b5b3c` ✓ |
| /lawlib digest — card bg/ink, slate-500 in lawlib contexts | paper + `#3a2f1f` ink; slate-500 → **#7a6845** (10 el.) ✓ |
| /lawlib reader — `[data-lawlib-body]` ink, toc bg, slate-400 | `#3a2f1f`; paper card; slate-400 → **#7a6845** ✓ |
| SettingsMenu labels ธีม/โทนกระดาษ (read mode) | **#7a6845** ✓ |
| Light mode (/lawlib + gallery) | placeholder zinc-400, labels zinc-500 — stock, untouched ✓ |
| Dark mode (/lawlib) | placeholder zinc-500, labels zinc-400 — stock, untouched ✓ |
| Non-lawlib in read mode (gallery / games / home) | placeholder **stays zinc-400**, zinc-500/300 stock, paper body only ✓ |

**Gates:** `npm run typecheck` clean · `npm run build` pass (exit 0; warnings pre-existing upload.ts/middleware, untouched).

## Known risks / for senior review

1. **Classic *page* bg nuance**: `#7a6845` on classic **page** bg `#f2e8d5` = **4.44:1** (0.06 under 4.5; on soft/warm pages 4.59/4.69 ✓). The EmptyState message sits on the page bg (not a card). Senior's 4.69–5.0 figures match card bgs exactly. **Decision:** accept (0.06 delta) or darken the page-surface rule slightly (e.g., `#756342` ≈ 4.66 on classic page). I implemented the senior-specified `#7a6845` verbatim.
2. **Pre-existing gap, out of scope**: the list page's `<p class="text-slate-500">` subtitle (page.tsx, outside `krulaw-*`) fails on paper (4.12–4.48:1). Not in the audit's surface list; flag if it should join the next contrast pass.
3. SearchInput's decorative search icon (`text-zinc-400`, `aria-hidden`) left untouched (not flagged).
4. **Dev-server infra**: Docker bind-mount file watching is broken (Turbopack never saw edits; needed 2× `rm -rf /app/.next/dev/{cache,static,server}` + `docker restart` to force recompiles — full recompiles ~5–14 min under parallel-junior load). Every branch flip re-breaks served-CSS consistency; the server currently serves stale lawlib-compiled CSS against the krulaw tree. Suggest devops enable polling (`TURBOPACK_WATCH_POLLING_INTERVAL` or `WATCHPACK_POLLING`) for the dev container. I did not start a second server; only restarted the existing one.
5. **Task 7 item 1** (SettingsMenu dropdown → `var(--read-card)` paper bg, "if approved") is in my file and I have the dropdown's DOM structure mapped (`#site-header` ancestor confirmed) — ready to implement on approval.
6. My fixes are committed **inside `ee88102`** — the current checked-out tree does not have them until the orchestrator merges/moves the branch.
