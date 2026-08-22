# ADR-019 — LAWLIB Toolbar Redesign "Dock v2"

**Date:** 2026-08-06 · **Status:** Proposed (pending user approval + senior-engineer review)
**Plan:** `.agents/plans/lawlib-ui-glassmorphism-fixes.md` T10

## Context
The reading dock has 15 icon-only buttons in 2 groups + expander. User pain (2026-08-06 interview): buttons unknown (icon-only), too many to find, position inconvenient, blind 3-state cycling (theme), bookmark redundant (2 buttons, no state), settings too limited. User directive: "redesign and improve toolbar for easier" + "make it most customizable". All decisions below are user-selected.

## Decisions

### D1 — Collapse-to-one-icon (all viewports)
- Collapsed = **1 plain tools icon** (no badge); click/tap expands the full panel; **stays open until explicitly closed** (Esc / pointerdown-outside / re-click icon) — NO auto-collapse after action
- Same mechanism desktop + mobile (replaces T9 FAB-collapse decision — unified)
- Dock position (D6) applies to the collapsed icon; expanded panel anchors from it with flip

### D2 — Expanded panel: 3-level hierarchy (user-confirmed 2026-08-06)
- **Level 0 — Collapsed:** 1 plain tools icon (no badge); click/tap expands
- **Level 1 — Popular/Fav tools:** default curated row `[ธีม▾] [ตัวอักษร▾] [บรรทัด▾] [กว้าง▾] | [🔖] [🔍] [📝] [เพิ่มเติม]`; user can pin/unpin favorites (persisted `favoriteToolKeys`)
- **Level 2 — "เพิ่มเติม" → ALL tools:** glossary · bookmarks list · copy · copy-link · ⚙️ full settings · per-tool pin toggle
- Panel **stays open until explicitly closed** (Esc / pointerdown-outside / re-click icon) — NO auto-collapse
- Pickers open anchored popovers (Esc/outside close, `aria-expanded`, focus mgmt — reuse ArticlePopover/LawTooltip infra); each shows current value
- Same mechanism desktop + mobile (replaces T9 FAB-collapse decision — unified)

### D3 — Tool set changes
- **Removed:** พิมพ์มาตรานี้ · พิมพ์กฎหมายทั้งฉบับ · คัดลอกมาตรานี้ · คัดลอกลิงก์มาตรานี้ · ปุ่ม palette
- **Copy + copy-link move into the article tooltip** (alongside new bookmark toggle) — article actions live where the user is
- **Bookmark v2:** 1 dock button (toggle + filled state + count badge) · list in เพิ่มเติม grouped by chapter · toggle also in article tooltip

### D4 — Rich settings (⚙️ panel, all persisted localStorage)
- Font size: **numeric 8-32px, default 16** (replaces s/m/l/xl enum — contract change)
- Font family ×5: Sarabun / Noto Sans Thai / Mali / Bai Jamjuree / Itim (self-host woff2, `@font-face display:swap` — downloads only when used)
- Line-height slider 1.0-2.0 (replaces cycle) · **Width: percentage slider 80–120%, default 100% = 80ch** (user rev. 2026-08-06; legacy presets map narrow→80/normal→100/wide→120; applied as `max-width: calc(80ch * pct/100)`)
- Paper yellow slider 0-100 inside theme picker (replaces 3-tone preset — contract change: paperTone enum → number)
- Themes: สว่าง / มืด / กระดาษ(+yellow slider) / sepia (**night ตัด 2026-08-06** — ≈ dark, user decision; sepia = paper-warm variant)
- **Glass slider (chrome only: dock + search):** Clear 0% ↔ Opaque 100%; 100% = solid + `backdrop-filter:none` (GPU saving)
- **Toolbar size slider 24-56px, default 44** (scales icons/labels)
- Paragraph spacing 0/0.5/1 · Font weight ปกติ/หนา · **Hide repealed toggle** (FULL + COMPACT)
- **Focus mode:** on activation, DISCLOSES what will be hidden (เมนูนำทาง, สารบัญ, dock, footer) before applying
- Paper-tone removed from header SettingsMenu (dedupe — same principle as bookmark redundancy)

### D5 — Data model
`ReadingSettingsValue` (lib/reader-props.ts frozen contract) changes: fontSize enum → number; width enum → number; paperTone 3-tone → number; + fontFamily, glassOpacity, toolbarSize, paragraphSpacing, fontWeight, hideRepealed, focusMode, theme. Frozen-contract tests + evals updated.

### D6 — Dock position: 8 positions
Selector grid 3×3 (minus center): Top-L/M/R · Mid-L/R · Bot-L/M/R (above BackToTop). Persisted. Anchor flip per position. Mobile FAB follows setting.

### D7 — New features (user-approved 2026-08-06, round 2)
- อ่านต่อจากที่ค้าง (resumePosition per slug — ปุ่ม "อ่านต่อ" ระดับ 1)
- พิมพ์เลขมาตรา → ข้ามไป (ใน picker ค้นหา)
- คืนค่าเริ่มต้น (reset ทุกค่า + favorites + ตำแหน่ง)
- เลื่อนอัตโนมัติ (slider 0=off + pause/resume + respect reduced-motion)
- ซ่อนโน้ตการแก้ไข (hideAmendmentNotes — คู่กับ hide repealed)
- ตัวบอก "กำลังอ่าน: มาตรา X" (IntersectionObserver; แสดงใน focus mode ด้วย)
- Tooltip = article actions hub: bookmark ± · โน้ตอ่าน + **เขียนด่วน** (autosave) + ลิงก์ panel · copy · copy-link (user: "both for convenience")
- Tab order term triggers: **คงเดิม + บันทึก known trade-off** (user decision)

### D14 — T23: Focus mode + Auto Scroll as dock tools (user-confirmed 2026-08-09)
- **2 new `DockToolKey` entries** (`focusMode` + `autoScroll`) — frozen-contract extension (checked: no eval baseline references the key list) + `DOCK_TOOL_KEYS` 11→13 → both render in L2 (เพิ่มเติม) AND are pinnable via the ⚙️ เครื่องมือแถวลัด editor (13 switches) · **NOT in default favorites** (decision: pin-able only)
- **Toggle semantics:** autoScroll tool = speed 0 ↔ LAST level (session ref `lastAutoScrollLevelRef`, default 3 when no history — reader-owned `onToggleAutoScroll`); focus tool = `settings.focusMode` through the ONE dock-level handler (`handleFocusModeChange`, shared by L1/L2 + the ⚙️ toggle — dock closes itself when activating)
- **activateTool explicit cases** (senior MAJOR — the default branch maps to the action-panel map, which would make the new keys DEAD buttons): `focusMode → handleFocusModeChange(true)` · `autoScroll → onToggleAutoScroll()`
- **Tool meta:** โฟกัส `fi-sr-eye` · อ่านอัตโนมัติ `fi-sr-play` (active → `fi-sr-pause`, bookmark-pattern) · both are aria-pressed toggles on L1 + L2 (T14 fix)
- **Speed display (⚙️):** pure `secondsPerLine(speed, fontSize, lineHeight) = speed ≤ 0 ? null : round1((fontSize·lineHeight)/(speed·48))` — 48 px/s per level (= 0.8 px/frame × 60, dt-normalized 120Hz-safe) · label `ระดับ {n} · {x.x} วิ/บรรทัด` · 'ปิด' when n=0 OR reduced-motion (matches the forced slider value)
- **SUPERSEDED 2026-08-11 (ADR-027 / T55)** — the speed display and engine now use the FIXED map `SECONDS_PER_LINE {1:1, 2:0.8, 3:0.5, 4:0.25, 5:0.1}` — `secondsPerLine(speed)` is arity-1 and typography-independent · the engine INVERTS (px/s = fontSize×lineHeight ÷ secondsPerLine) so one rendered line takes exactly the mapped seconds at any font size · the 48 px/s formula above is historical only
- **Settings panel expansion** (user 2026-08-09 — "theme/text size/… both on dock AND settings"): 5 reading-surface sections (ธีม 4 modes / ความเหลืองของกระดาษ / ขนาดตัวอักษร / ความสูงบรรทัด / ความกว้างเนื้อหา) REUSING the L1 picker components (single source — same components, second mount point; L1 pickers kept) · paper tone now writes `lawlib:paperTone` from BOTH mounts through the same ThemeProvider state (the old "paper slider lives ONLY in the theme picker" single-source comment updated) · `theme`/`setTheme`/`paperTone`/`setPaperTone` props passed down from the dock
- **Out of scope:** view mode, aside drawer, default-favorites changes, new font glyphs (subset already carries eye/play/pause)

### D11 — Dock v2.3 COMPACT layout (user-confirmed 2026-08-08 — T15 v2)
- **L1 glass panel 416px → 64px (`w-16`)** — คง wrapper glass เดิมทั้งหมด (`lawlib-glass lawlib-glass-xs lawlib-glass-sheen` — border + bg + blur) — **v1 ลบ wrapper แล้ว user ปฏิเสธ ("ไม่มี border/bg") → v2 คง glass ไว้และแค่แคบลง** · padding `p-1.5` (~52px content) · pickers = 44px icon + ค่าใต้ไอคอน (text-[10px]) ยืดเต็มคอลัมน์ · actions = 44×44 คงเดิม · ตำแหน่งกลาง (บน/ล่างกลาง) = panel กว้างตามเนื้อหา (max-w-[min(92vw,26rem)]) ไม่ใช่ w-16 (แถวแนวนอนต้องมีที่วาง)
- **Panel header ลบ** (⚙️ ย่อ + ชื่อ + ×) — แทนด้วยปุ่มคู่ท้าย L1 (28×28): **⋯ dots (`fi-sr-menu-dots` \f667, เพิ่ม glyph ใน subset font)** TOGGLE L2 (`setMoreOpen(prev => !prev)`, aria-label เพิ่มเติม คงเดิม — e2e parity) + **× close (`fi-sr-cross`, ปิดแถบเครื่องมือ)** ยุบ dock เหลือไอคอน (userClose(true) — จำสถานะยุบ)
- **L2 = แผง glass พี่น้อง 112px (`w-28`)** — แยกจาก L1 (ไม่อยู่ใน wrapper 416px เดิม): anchor ด้วย flip `more` ใน POSITION_CONFIG (ขวา→left-full, ซ้าย→right-full, ล่างกลาง→bottom-full, บนกลาง→top-full — ออกจากขอบจอ) · glass เดียวกับ L1 (ยกเลิก `lawlib-glass-strong` — แผ่นเดียวกัน) · grid ไอคอน 32×32 (`h-8 w-8`) 2 คอลัมน์ gap-0.5 — แถว 1 = favorites ชุดเดียวกับ L1 + divider + แถว 2 = ที่เหลือ (glossary/bookmarks-all/copy/copy-link/⚙️) · **ไม่มีปุ่มย้อนกลับ / section title / ข้อความ**
- **Esc cascade คงเดิม:** picker → L2 (focus → ⋯) → ปิด dock (focus → ไอคอน) · focus เปิด L2 → ไอคอนแรกของ L2 (แทนปุ่มย้อนกลับเดิม — a11y fix #1)
- **มือถือ (≤639px):** bottom sheet แสดง L1 อย่างเดียว · **L2 ยุบ default** (⋯ ขยายเป็น block ใน sheet) · sheet คง glass เต็มความกว้าง
- **Popovers ไม่แตะ:** search/notes/bookmarks/settings คงความกว้าง (w-56..w-72)
- L0 ไอคอนยุบ / เปิด default / ไม่ปิดนอก / animation / จำสถานะ / dots ค่าปรับแล้ว — ทั้งหมดคงเดิม

### D10 — Dock v2.2 layout (user 2026-08-07, wave 4 — release ร่วมกับ W3)
- **L1 = ไอคอน + ค่าที่ตั้งใต้ไอคอน:** ตัวอักษร "14px" · ความกว้าง "100%" · บรรทัด "1.8" · **ธีม = ไอคอนล้วน** (☀️/🌙/📖 สะท้อนสถานะ — ไม่มี label) · actions (bookmark/search/notes/อ่านต่อ/เพิ่มเติม) = ไอคอนล้วน
- **L2 = ไอคอนล้วน 2 แถว:** แถว 1 = main+fav (ชุดเดียวกับ L1) · แถว 2 = ที่เหลือ (อภิธานศัพท์/ที่คั่นหน้าทั้งหมด/copy/copy-link/⚙️) + ย้อนกลับ — **ไม่มี section title/ข้อความ/ปุ่มปักหมุดบนไอคอน**
- **Pin management → ⚙️ settings panel** (favorites editor — checkbox/ปุ่มต่อเครื่องมือ) — L2 ไม่มีกลไกปัก
- ที่คั่นหน้าทั้งหมด = panel (เปิดจากไอคอน — เหมือน search/notes panels) — ถ้ายังเป็น section ใน L2 ให้แปลง
- คงเดิม: L1 เปิด default · ไม่ปิดเมื่อคลิกนอก · glass 35% · ทิศทาง · animation · dots · จำสถานะ
### D9 — Dock v2.1 revision (user 2026-08-06, post-release feedback)
- **Glass จริง (ทะลุ):** panel + collapsed icon = **transparent 30-40% (default 35%)** + **highlight border** (ขอบบนสว่าง ~white/30 — classic glass sheen) + **blur-xs** · `glassOpacity` default 75→**35** · ปุ่ม/ไอคอนใน dock คงพื้นผิวตัวเอง (contrast AA — แผ่นโปร่ง แต่ปุ่มไม่โปร่ง) · L2/⚙️ settings panel = glass-3 (ทึบกว่า อ่านง่าย — แผ่นโปร่งเฉพาะ L1 + ไอคอนยุบ) · **Tooltip = glass ด้วย (T12b):** panel ตาม slider (0-100 — โปร่ง/ทึบตาม settings) · เนื้อหาข้างใน (ตัวบท/ปุ่ม/textarea) คงพื้นผิวตัวเอง (AA) · read/sepia = paper เดิม (dead-blur คง)
- **L1 เปิด default:** reader mount → Level 1 แสดงทันที (ไม่ย่อเหลือไอคอน) · ปิดด้วย **Esc / ปุ่มยุบ / X เท่านั้น** — **pointerdown-outside ไม่ปิดอีกต่อไป** (กลับคำตัดสิน D1)
- **ขยายตามทิศทาง:** ด้านข้าง (L/R) → L1 = คอลัมน์แนวตั้ง · L2 = แผงแนวตั้ง grid 2 คอลัมน์ · กลาง (บนกลาง/ล่างกลาง) → L1 = แถวแนวนอน · L2 = grid แนวนอน · มือถือ = bottom sheet (ตามตำแหน่งที่เลือก)
- **Animation** ขยาย/ยุบ (slide+fade ~150ms, respect reduced-motion) — **default ON**, สวิตช์ใน settings
- **จุดบอกค่าที่ปรับแล้ว** — ปุ่ม picker ที่ค่าไม่ใช่ default แสดงจุดสีฟ้าเล็ก (เปิดถาวร)
- **width default = 100%** (โค้ดมีแล้ว ✓ — ค่าที่เห็น 80% = stored value เก่า; reset แก้ได้)
- **Reset รายการ** — แต่ละ slider/ตัวเลือกมีปุ่มคืนค่าเฉพาะตัว (settings panel)
- **จำสถานะยุบ/ขยาย** — user ยุบเอง → ครั้งหน้าเริ่มยุบ (localStorage); ไม่เคยยุบ → เปิดตาม default
- **Chrome glass ทุกธีม ไม่มีข้อยกเว้น (T12c, user 2026-08-06):** dock/tooltip/search = glass ใน read/sepia ด้วย — ยกเลิก paper override + dead-blur kill ของ chrome ทั้ง 3 (GPU กลับมาใน read — user ยอมรับ) · พื้นหลัง paper + การ์ดเนื้อหา/TOC คงเดิม (อ่านสบาย) · tooltip glass ตาม slider (T12b)
- **Position selector → ⚙️ settings panel (T12c, user 2026-08-06):** ย้าย 8-dot จาก Level 2 (เพิ่มเติม) เข้า SettingsPanelContent — ตั้งค่าทั้งหมดอยู่ที่เดียว

### D8 — Resolutions from scrutiny (2026-08-06)
- **Toolbar size 24-56 (default 44)** = user-controlled EXCEPTION to the 44px convention (T9 sweep applies everywhere else) — documented, not a contradiction
- **Sticky มาตรา X indicator:** bar top-0 z-40; dock top positions anchor BELOW it (offset) — no collision
- **Glass slider floor:** 0% valid = border + focus ring carry the boundary (chrome only — no readability risk on reading surfaces)
- **paperTone number 0-100:** ThemeProvider computes `--read-bg/--read-card` as INLINE CSS VARS from the numeric value (replaces `html.read[data-paper-tone=…]` class selectors — legacy values mapped soft→30/classic→50/warm→80)
- **Header SettingsMenu:** reading settings ย้ายเข้า dock ⚙️ ทั้งหมด (dedupe) — header คง site-wide settings เท่านั้น (paper-tone + ReadingSettings ออกจาก header)

## Consequences
- Discoverability: pickers always show current value; direct choice replaces blind cycling
- Dock footprint: 15 buttons → 1 icon collapsed / ~9 controls expanded
- Customizability: 10+ settings; glass slider doubles as GPU saver at 100%
- Scope: T10a (structure/pickers/bookmark/position ~2d) + T10b (settings panel ~1.5-2d); client-side only; font assets ~4 families on-demand (no build bundle impact with display:swap); localStorage only, no DB/server impact (pool 3, 1 vCPU unaffected)
- Risk: contract change touches reading-settings consumers (ReadingSettings.tsx, reader-props tests, evals); focus mode must not trap (disclosure + easy exit)

## Files (T10)
LawlibReaderClient.tsx · picker components (new) · LawTooltip.tsx · BookmarksPanel · ReadingSettings.tsx · globals.css (glass vars) · lib/reader-props.ts · font assets ×4 · evals · tests
