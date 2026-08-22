# LawLib Authoring Guide — Full & Digest files (future laws)

> Canonical rules for authoring law content files. Codified 2026-08-05 from the พ.ร.บ.การศึกษาแห่งชาติ พ.ศ. 2542 implementation (82 มาตรา, 4 ฉบับ, user-reviewed มาตรา-by-มาตรา + PDF-verified). Reference law: `content/lawlib/laws/national-education-act-2542.md` + `content/lawlib/digests/national-education-act-2542.md`.

## 1. Overview — two files, two pipelines

| File | Path | Consumed by |
|---|---|---|
| **Full law** | `content/lawlib/laws/<slug>.md` | build → `src/data/lawlib/laws/<slug>.json` (FULL view + amendment TOOLTIPS) |
| **Digest (compact)** | `content/lawlib/digests/<slug>.md` | runtime-parsed by `digest-view.ts` → COMPACT view |

- **Amendment history lives in the FULL file's markers** → JSON → tooltips. The digest file carries **NO history** (rule 2026-08-05: annotation/ประวัติ → tooltip).
- Law md changes → rebuild JSON + gates. Digest md changes → no rebuild (runtime), but `build.ts --check` + vitest still run.

## 2. FULL law file

### 2.1 Frontmatter (exact keys)
```yaml
---
slug: national-education-act-2542        # lowercase-hyphen
code: "พ.ร.บ.การศึกษาแห่งชาติ พ.ศ. 2542"
titleTh: "พระราชบัญญัติการศึกษาแห่งชาติ พ.ศ. 2542"
subject: กฎหมายการศึกษา
part: ข                                 # ก/ข/ค (การศึกษา = ข)
tags: [การศึกษา, พรบ, สถานศึกษา]
verifiedAt: "2026-08-04"                 # last full PDF-verification date
gazetteRef: "ราชกิจจานุเบกษา เล่ม 116 ตอนที่ 74ก วันที่ 19 สิงหาคม 2542"
editions:                                # ALL amendment acts, in order
  - no: 1
    gazetteDate: "2542-08-19"
    effectiveDate: "2542-08-20"
    note: "ประกาศใช้บังคับ"
  - no: 2
    gazetteDate: "2545-12-19"
    effectiveDate: "2545-12-20"
    note: "แก้ไขเพิ่มเติม (ฉบับที่ 2)"
---
```
Dates must match the PDF footers (ราชกิจจานุเบกษา เล่ม/ตอนที่/หน้า/วันที่) exactly.

### 2.2 Body structure
1. `## ความหมาย` — definitions summary FIRST (for laws with a มาตรา 4 definition block): `- **การศึกษา** : <นิยามเต็ม>` one bullet per term. (Law md only; the digest repeats this in its Section 3.)
2. `## หมวดที่ N <ชื่อ>` sections · `### ส่วนที่ N` sub-sections · `### บทเฉพาะกาล` for transitional articles.
3. `**มาตรา N**` headers — **ARABIC digits** (`มาตรา 1`, `มาตรา 32/1`); body quotes keep **Thai numerals** as in the gazette (parser normalizes Thai digits).
4. **Consolidated CURRENT text only** (ฉ.1 as amended by all editions). Historical text appears ONLY inside repealed-quote blocks (2.4).
5. Cross-refs: `[[มาตรา N]]` wikilinks (rendered as jump/tooltip links). Suffix forms: `[[มาตรา 10]] วรรคสอง`.

### 2.3 Amendment markers (the tooltip grammar — parser frozen regexes)
Place `>` quote lines immediately after the affected article/paragraph:
```
> แก้ไขเพิ่มเติมโดยฉบับที่ 2 ฉบับที่ 2 (2545) - แก้ไข: อำนาจหน้าที่: กำกับดูแลการศึกษา + ศาสนา/ศิลปะ/วัฒนธรรม -> ส่งเสริมและกำกับดูแลการศึกษา
> แก้ไขเพิ่มเติมโดยฉบับที่ 4 ฉบับที่ 4 (2562) - แก้ไข: ขอบเขต: การศึกษาทุกระดับ/ประเภท -> ไม่รวมระดับอุดมศึกษาในกระทรวงอื่น
```
- Grammar: `> <action>โดยฉบับที่ N ฉบับที่ N (พ.ศ.) - <note>` where action ∈ แก้ไขเพิ่มเติม / เพิ่ม / ยกเลิก / เพิ่มเติม. One marker PER edition-change; stack them for multi-edition articles (มาตรา 37: ฉ.2 + ฉ.3 markers).
- Notes are SHORT before→after summaries with `->`; verified against BOTH the original text and the amendment text.
- Added articles: `> เพิ่มโดยฉบับที่ 4 ฉบับที่ 4 (2562) - เพิ่ม: มาตราใหม่: คณะกรรมการการอุดมศึกษา`
- Repeals: `> แก้ไขเพิ่มเติมโดยฉบับที่ 4 ฉบับที่ 4 (2562) - ยกเลิก: รายงานต่อ: คณะกรรมการการอุดมศึกษา (กอว.)`
- 25-note/18-article scale is the reference norm for a 4-edition law.

### 2.4 Repealed-text blocks (keep the old text for reference)
```
> ~~วรรคสาม~~ ถูกยกเลิกโดยพระราชบัญญัติการศึกษาแห่งชาติ (ฉบับที่ 4) พ.ศ. 2562
> คณะกรรมการการอุดมศึกษา มีหน้าที่พิจารณาเสนอ... (full original text, `>` per line)
```
Struck-through (`~~…~~`) marks what is repealed; the quote lines carry the original wording.

## 3. DIGEST file

### 3.1 Header
```
# พจนานุกรมกฎหมายการศึกษา — พ.ร.บ.การศึกษาแห่งชาติ พ.ศ. 2542
> Study digest — important parts only. Full reference: `content/lawlib/laws/<slug>.md`
> Status: **COMPLETE** — 4 sections, user-reviewed มาตรา-by-มาตรา (2026-08-03) · restructured 2026-08-05 (merged cards + annotation → tooltip).
```

### 3.2 Section 1 — ข้อมูลกฎหมาย (ชื่อ / ประกาศ รก. / มีผลใช้บังคับ)

### 3.3 Section 2 — ประวัติการแก้ไข (per-edition format, LOCKED 2026-08-05)
```
**ฉบับที่ 2 (2545):**
- ประกาศ: 19 ธ.ค. 2545 · มีผลใช้บังคับ: 20 ธ.ค. 2545
- ผู้รับสนองฯ: ทักษิณ ชินวัตร นายกรัฐมนตรี
- เหตุผล: <ย่อจาก หมายเหตุ ของกฎหมายแก้ไข>
- แก้ไข: [[มาตรา 4]] (นิยาม "กระทรวง") · [[มาตรา 5]] · [[มาตรา 31]], [[มาตรา 32]], ... · [[มาตรา 45]] (วรรคสอง), [[มาตรา 74]] (วรรคสอง)
```
- **No แทน/เพิ่ม/ยกเลิก words** — first list = default แทน; tags `(เพิ่ม)` `(ยกเลิก)` for the other groups; scope notes in parens `(นิยาม "กระทรวง")` `(วรรคสอง)`; separator `·` between groups, `,` within a group; wikilinks on every article.
- Non-act orders (คสช. etc.) get their own entry: `**คำสั่ง คสช. 10/2559:**` + `- ผล: ...`.

### 3.4 Section 3 — คำนิยามสำคัญ
- Heading: `(มาตรา 4 — 16/16 คำนิยาม)` — NO history annotations (moved to tooltips).

### 3.5 Section 4 — มาตราสำคัญ (cards)
- Card: `**มาตรา N** : <สรุปหรือข้อความเต็ม>` — bullets (`- `) for list content; `(1)` numbered lines for sub-items.
- **Merged card**: `**มาตรา 11 - มาตรา 12** : <เนื้อหารวม>` — supported by the parser (landed 2026-08-05); anchor = first key, popover stacks member articles, hover tooltips per member. Merge only contiguous ranges + only on user approval (one-by-one review).
- `### บทเฉพาะกาล` h3 before transitional articles (consumed as the chapter-group header).
- **Global rules (user-locked 2026-08-05)**:
  - NO inline amendment annotations: no `> แก้ไขเพิ่มเติมโดยฉบับที่ N ...`, no `· แก้ไขเพิ่มเติม...`, no `> เพิ่มโดย...` — history shows in tooltips only
  - NO `[ดูเต็ม [[มาตรา N]]]` links — the tooltip's เปิดมาตรานี้ replaces them
  - NO `- ประวัติ:` lines (the digest-view history field was REMOVED — they'd render as plain bullets)
  - No inline history asides ("เดิมมี 3 — ถูกยกเลิกโดยฉบับที่ 4") — tooltip covers it
  - มาตรา 5-type entries: current text only.

## 4. Verification workflow (mandatory before verifiedAt)
1. Official PDFs for **ALL editions** from krisdika (สํานักงานคณะกรรมการกฤษฎีกา); extract text via a compiled PDFKit helper (`swiftc`-compiled; the `swift` driver can intermittently print nothing).
2. Per edition verify: gazette ref (เล่ม/ตอนที่/หน้า), ประกาศ/มีผล dates, ผู้รับสนองฯ (PM), เหตุผล summary, exact amended/added/repealed article list.
3. Verify EVERY definition against the original act text.
4. Verify every marker note's `->` left side against the original text and right side against the amendment text.
5. Browser-verify: FULL tooltips, digest history lines, compact cards/merged popovers.
6. Set `verifiedAt`, rebuild, gates, commit.

## 5. Gotchas (hard-learned)
- **krisdika PDF text layers are NOT trustworthy** (regenerated 2026 files contain NUL-byte glyph holes — e.g. มาตรา 66 lost "ต่อ": text layer "อย่างเนื[?]อง" vs official "อย่างต่อเนื่องตลอดชีวิต"; official sources win). Cross-check odd readings against cr3.go.th consolidated PDFs / academic papers citing the gazette.
- Wording traps found: "จัดการ**ประเมินผู้เรียน**" (no ผล) · "ควบคู่ไป**ใน**" (not กับ) · "การ**ทะนุ**บำรุง" (not ทำนุ).
- `build.ts` WITHOUT `--include-sample` DELETES `sample.json` — always use `npx tsx scripts/lawlib/build.ts --include-sample`.
- Digest md = runtime-parsed: content edits don't require JSON rebuild; law md edits DO.
- Parallel agents must not run git ops concurrently; the edit tool does not serialize same-file writes (stale-snapshot clobber observed 2026-08-05).
- Thai digits normalized by parser; Arabic in headers, Thai in body quotes.

## 6. Build & gates
```
npx tsx scripts/lawlib/build.ts --include-sample   # + --check for validation
snip run -- npx vitest run tests/lawlib
snip run -- npm run typecheck && npm run lint
npm run eval   # lawlib feature; pass^3 = 1.00 for release
npm run build  # final verification
```
Browser QA: FULL tooltips (amended/non-amended), digest history lines, compact hover tooltips + popover, merged-card members, mobile tap.

## 7. New-law checklist
1. Obtain + extract all edition PDFs (krisdika); verify metadata.
2. Author full law md: frontmatter → ความหมาย → หมวด/มาตรา consolidated text → markers per edition (verified notes) → repealed blocks.
3. `build.ts --include-sample` → JSON; vitest + typecheck + lint.
4. Author digest md: 4 sections per this guide; merged cards ONLY after user review.
5. Browser-verify both views + tooltips; set verifiedAt; commit; changelog + version bump (ask user).
