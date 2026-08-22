# ADR — กฎหมายภายนอกใน editions + amendment markers

**Date:** 2026-08-18
**Law:** พ.ร.บ.การจัดการศึกษาสำหรับคนพิการ พ.ศ. 2551 (digest review #7)

## Decision

Foreign acts (พ.ร.บ.ที่มิใช่วาระแก้ไขของกฎหมายฉบับนี้) ที่แก้ไของค์ประกอบ/ผู้รักษาการ
จะถูกบันทึกเป็นรายการ editions เพิ่ม (หมายเลขถัดจากฉบับล่าสุด) + amendment marker
`> แก้ไขเพิ่มเติมโดยฉบับที่ N ...` หน้ามาตรานั้นใน laws md

- ฉ.19/2562 (พ.ร.บ.ปรับปรุงกระทรวง ทบวง กรม) → editions `no: 3` (2562-05-01/02)
  note ระบุชัด: "กฎหมายภายนอก: ปรับโครงสร้าง อว. (ไม่ใช่วาระแก้ไขของ พ.ร.บ. นี้)"
- markers 3 จุด: [[มาตรา 4]] (เพิ่ม รมว.อว.) · [[มาตรา 11]] (3) (เพิ่มปลัด อว. — เลิกเลขาธิการ กกอ.) · [[มาตรา 22]] (เพิ่มผู้แทนสำนักงานปลัด อว.)

## Why

- User verdict "add note to tooltip" — amendment notes render in LawTooltip
  (`.lawlib-amendment-notes`) from article.amendedBy
- validate rule 5 requires amendedBy.editionNo ∈ editions[]; numbering sequential
  → cannot use `ฉบับที่ 19` marker without breaking validation
- ผู้ใช้รับทราบ tradeoff: EditionTimeline จะแสดง "ฉบับที่ 3" (label ตาม e.no)
  — note ใน frontmatter อธิบายว่ากฎหมายภายนอก

## Tradeoffs / Rejected

- **Inline digest note only (rejected):** ไม่ตรง verdict ผู้ใช้; ม.4 การ์ดมี inline อยู่แล้ว
  แต่ tooltip (full view) ไม่แสดงที่มา → ผู้ใช้เลือก tooltip route
- **Marker ฉบับที่ 19 + editions no:19 (rejected):** violate sequential numbering rule
- **Parser/validate code change for external markers (deferred):** ใหญ่เกินไปสำหรับ
  1 note; ถ้ามีกฎหมายภายนอกหลายฉบับ → revisit (พิจารณา add `external: true` field)

## Impact

- laws md 1 ไฟล์: +1 edition entry, +3 marker lines
- ไม่มีโค้ดเปลี่ยนแปลง (schema รองรับอยู่แล้ว)
- พรีซีเดนต์: child-protection-act-2546.md ยังไม่มี marker ใด ๆ (ฉ.19/2562 ของมัน
  ถูก document แค่ใน digest §2) — follow-up ต่างหาก, นอกขอบเขต

## Extension 2026-08-18 (law #8 — salary-and-allowances-act-2547)

Pattern reused for **sub-legislation** (กฎ ก.ค.ศ./ประกาศ 2567–2568 ปรับอัตราเงินเดือน
แรกบรรจุ +10%/ปี — มิใช่การแก้ไข พ.ร.บ.): editions `no: 4` + marker on มาตรา 3
(note carries full 15,050→16,560→18,220 progression). User verdict: digest แสดง
เฉพาะค่า **ล่าสุด (2568)**; ค่าก่อนหน้า (2567/ฉ.3) อยู่ **ใน tooltip เท่านั้น**
(schema: edition note = "กฎ ก.ค.ศ. — มิใช่การแก้ไข พ.ร.บ."; tooltip label
"ฉบับที่ 4" — user-accepted tradeoff, same as law #7)