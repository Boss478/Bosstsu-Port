# ADR-026 — Reader fixes batch (2026-08-11)

Batch: width dead zone · merged line spacing · search drawer glass · dock icon glass · picker popover overlap. Base: v1.12.3 released (`f726bfc`), tree clean.

---

## W1 — Content width 121–160% dead zone (FIX)

**Problem (user 2026-08-11):** width slider >~120% has no visible effect.

**Root cause (verified in code):** Full view lg+ grid = `lg:grid-cols-[16rem_minmax(0,1fr)]` inside wrapper `mx-auto max-w-6xl px-4` (1152px) → article column max ≈ 832px. Card max-w = `calc(80ch × pct/100)` (WIDTH_CLASS) → at default 16px font, 120% ≈ 768–840px ≈ column cap → 121–160% clipped. Compact/mobile unaffected (column 1120px). Dead zone starts earlier at larger fonts.

**Fix (user-approved approach — "wrapper ขยายตาม"):**
- Wrapper `LawlibReaderClient.tsx:1776` keeps classes; add to `readerSurfaceStyle` (already on the wrapper): `maxWidth: 'max(72rem, calc(var(--lawlib-width) + 20.5rem))'` — 20.5rem = TOC 16rem + gap 2rem + px-4 2rem + 0.5rem slack. Grid unchanged (`minmax(0,1fr)` column + card's own max-w var).
- Result: 121–160% real at every font size; wrapper never shrinks below 72rem (80–~120% look unchanged); header/TOC ride wider at 121%+ (user accepted).
- No changes to CompactView (already works).

**Resource cost:** none (CSS var only). Load: client.

---

## W2 — Merge Line Spacing + ระยะห่างย่อหน้า (USER DECISION — "รวมเป็นตัวเดียว")

**Problem:** user confirmed (2026-08-11) the two controls should be ONE; separately, line spacing has NO effect in compact view.

**Root causes:**
1. **Compact lineHeight dead (verified):** CompactView digest text elements carry their own `leading-relaxed` (633/587/833/967/978/989/1002/1047 + h3s) — their own class beats the inherited inline `lineHeight` from the wrapper (1353). Full view works (ArticleView p/li inherit).
2. Two separate controls confuse (lineHeight 1.2–2.4 vs paragraphSpacing 0/0.5/1).

**Fix:**
- **Merge:** `--lawlib-para-spacing` becomes DERIVED from `settings.lineHeight`: `paraSpacing = clamp((lineHeight − 1.2) / 1.2, 0, 1) rem` → 1.2→0 · 1.8→**0.5** · 2.4→1.0 (linear, continuous). ⚠️ DEFAULT LOOK CHANGES: p+p margin at default 1.8 = 0.75 + 0.5 = 1.25rem (was 0.75rem) — flagged for user veto at plan approval.
- Remove `paragraphSpacing` field from `DEFAULT_READING_SETTINGS` + `ReaderSettings` type + the settings-panel control (`PARAGRAPH_SPACING_OPTIONS` row at LawlibPickers:1287 + label "ระยะห่างย่อหน้า" 1278). Stored legacy values become inert (loader merges with defaults; no crash). Line Spacing label gains hint "รวมระยะห่างย่อหน้า".
- `typographyVars` (LawlibReaderClient:1427) sets `--lawlib-para-spacing` from the derived value.
- **Compact fix:** remove the own `leading-*` classes on digest text elements that should follow the slider (they then inherit the wrapper's inline lineHeight); keep on headings (h2/h3/h3s — typographic headings stay fixed per design; note in commit body).
- Tests: settings-panel — remove/replace paragraphSpacing pins (grep `paragraphSpacing` across tests); reader-settings migration pins for the removed field (legacy stored value ignored); add compact leading test (class stripped / inherits).

**Resource cost:** none. Load: client.

---

## W3 — Reader search drawer GLASS in all themes (USER DECISION — "Glass ทุกธีม")

**Problem:** search drawer is solid (aside `bg-white dark:bg-slate-900`, ReaderClient:2109); SearchPanel input `lawlib-glass` overridden solid by explicit `bg-white dark:bg-slate-900` (SearchPanel:130); read/sepia deliberately paper (T12c).

**Fix (all themes, overrides T12c's paper classification for the drawer):**
- Drawer aside (2109): `bg-white dark:bg-slate-900` → **`bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl`** (fixed glass — readable over article, big surface; AGENTS.md: panel surfaces may keep their own glass blur). Applies to ALL tabs in the drawer (search/glossary/notes/bookmarks share the aside — consistent surface).
- SearchPanel input (130): drop the solid `bg-white dark:bg-slate-900` override → `bg-white/60 dark:bg-slate-800/60 backdrop-blur-md` (matches list-page SearchInput look).
- Remove the paper overrides: globals.css `.read .lawlib-panel .lawlib-glass, .sepia ...` (2282–2292) — delete; remove `.lawlib-panel` from the paper card-surface list (2354–2363) — keep article-card/toc/list-card/digest-card; update the T12c comment (2369–2374) — drawer reclassified chrome.
- Modal overlay rule stays (`bg-black/10`, no blur — untouched).

**Resource cost:** GPU compositing + blur over content (one extra 26rem-wide blurred layer, transient while drawer open). Load: client. Acceptable per budget (dock/L2 already blur).

---

## W4 — Dock icon glass: FIXED 50% + 8px (dark 60%) (USER VALUE)

**Current (fixed):** L1/L2 round icon buttons idle = `bg-white/60 dark:bg-slate-800/70` + `backdrop-blur-sm` (8px). Collapsed icon = slider-driven (`lawlib-glass lawlib-glass-xs`) — NOT in scope.

**Fix:** idle state only → `bg-white/50 dark:bg-slate-800/60` (blur stays 8px). Active/selected state (blue-tinted `bg-blue-50/90 dark:bg-blue-950/70`) untouched. L2 panel surface (858: 60%/70% + 8px) untouched — buttons sit slightly more transparent than the panel (intentional hierarchy).

**Files:** LawlibDock.tsx L1 tool buttons (1034–1038 idle branch) + L2 tool buttons (~1174 same pattern).
**Resource cost:** none. Load: client.

---

## W5 — Picker popover overlaps dock on theme→paper/sepia switch (FIX)**Problem (BOT-MID):** switching light/dark → paper/sepia mounts the กระดาษ tone slider (themeUsesPaper) → popover grows ~55px; position was computed ONCE at open (PickerPopover useLayoutEffect deps [anchorEl]) → pinned `top` + stale transformOrigin → bottom edge slides down over the anchor button + dock.

**Fix:** extract the positioning (below-first flip + origin) into a function; run on open (useLayoutEffect [anchorEl]) AND on content size change via **ResizeObserver on the popover root** (recompute top/left/origin; keeps above-flip when growing). Covers both grow (light→paper) and shrink (paper→light). No behavior change for static pickers.

**Tests:** unit — theme picker switch to read/sepia → popover bottom ≤ anchor.top (recomputed); or DOM-height simulation. Live repro first (debug-mantra step 1): open theme picker at BOT-MID, switch to กระดาษ — measure overlap before/after fix.
**Resource cost:** one ResizeObserver per open popover (transient). Load: client.

---

## W6 — Settings panel regroup: remove "สำคัญ" + 3 groups (USER DECISION 2026-08-11, scrutinize ×2)

**Problem:** the T47 quick section (สำคัญ: กระจก/การเคลื่อนไหว/เลื่อนอัตโนมัติ) sits above everything; the rest is a flat mixed list — user wants quick section GONE and everything in 3 labeled groups.

**Structure (LOCKED):** group headers h2 (กราฟิก/ตัวอักษร/เครื่องมือ) · section titles h3 via new `level` prop on SettingsSectionTitle.
- **กราฟิก:** ธีม → ความเหลืองของกระดาษ → กระจก → การเคลื่อนไหว
- **ตัวอักษร:** ขนาดตัวอักษร → ความสูงบรรทัด (รวมระยะห่างย่อหน้า) → ความกว้างเนื้อหา → ฟอนต์ตัวบท → ความหนาตัวอักษร → เนื้อหา (ซ่อนมาตรา/โน้ต)
- **เครื่องมือ:** เลื่อนอัตโนมัติ → โฟกัส → เครื่องมือแถวลัด → ตำแหน่งปุ่ม → ขนาดแถบเครื่องมือ (reading aids first — scrutinize: auto-scroll must not sink to the bottom)
- **คืนค่าทั้งหมด** stays last, outside groups.
- **Divider spec (scrutinize F-A):** h2 = group divider (first group border-t-0) · h3 = border-t except `h3:first-of-type` per group — every section gets a divider (today staggered sections have NONE — intended consistency fix).
- **Stagger (3 steps):** กราฟิก 0ms · ตัวอักษร 40ms · เครื่องมือ 80ms (folds away the old 5-section stagger wrappers).
- **Focus:** first control becomes the ธีม button (was glass slider) — accepted, verify live.
- **Verify guard:** the v1.12.3 "Glass→Motion→Auto" order guard is obsolete — replaced by the group order.

**Resource cost:** none (layout only). Load: client.

---

## Constraints honored
- 1 vCPU / 4GB / DB pool 3 — zero DB involvement · no new deps · no server changes
- Rate limits untouched · concurrency envelope untouched (CSS/layout only + one observer)
- AGENTS.md UI rule: overlay stays `bg-black/10` no blur ✓
- Commit convention ADR-022 · NO push until release approval
- Version: bump 1.12.3 → **1.12.4** (patch) at release

## Release order
T49 (W1) → T50 (W2) → T51 (W3) → T52 (W4) → T53 (W5) — files disjoint, sequential ok (single tree, no parallel).

## Risks / notes
- W2 default-look change (p+p 0.75→1.25rem at 1.8) — user veto point at approval.
- W3 read/sepia: glass drawer over paper — 75% white glass on cream = lighter panel; acceptable per user decision (glass every theme).
- W5: ResizeObserver loop risk — recompute only when height actually changes (guard with previous height ref).
- Eval lawlib 17/17 must stay green; settings-panel/reader-settings tests need repin for W2.
