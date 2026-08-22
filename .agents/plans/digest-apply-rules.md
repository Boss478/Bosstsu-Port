# RULES — LawLib Digest Review + Apply Lane (single source of truth)

> Established 2026-08-18→19 across the 10-law digest program. Canvas: Boss478 content/lawlib.
> Supersedes inline notes. Cite this file in any future digest review / apply-lane intake.

---

## A. Review rituals (main agent)

1. **Latest data first** — before every law: `websearch` for amendments (ฉ.2/3/4) + sub-law changes; flag discrepancies to user before cards.
2. **One card at a time** — show card (quote block), ask verdict via `question` tool with preset options. When user edits a draft, re-show revised + re-ask `OK — apply & next`.
3. **Verdict presets** per card type:
   - มาตรา 1–2 (ชื่อ/ใช้บังคับ): **DROP** (ซ้ำ §1) — recommended every law.
   - บทเฉพาะกาลที่หมดอายุ (87–88, 27–29, 29–31): **DROP**.
   - อำนาจ/หน้าที่ 10+ ข้อ: option to **Group** into labeled buckets (นโยบาย/กองทุน/กำกับ/ส่งเสริม-อื่น).
   - วาระ/พ้นตำแหน่ง/ประชุม: **Compact** 2 bullets.
   - มาตรา 4 / ผู้รักษาการ: plain line; no "(ร่วม)" note unless asked.
   - มาตรา 3 (ยกเลิกกฎหมายเดิม): Drop/Keep — check content coverage elsewhere; user decides.
4. **Numbers/sub-legislation** (user verdict, law #8): digest shows **latest only**; previous/history → tooltip (see §C). Never fabricate — verify vs ก.ค.ศ./รก. sources with citations.
5. Final **DROP proposal** per law for transitional provisions — user signs.

## B. Digest file conventions

- Sections: §1 ข้อมูลกฎหมาย · §2 ประวัติการแก้ไข · §3 คำนิยามสำคัญ · §4 มาตราสำคัญ (cards).
- Card header: `**มาตรา N - มาตรา M** : **หัวข้อ**` (compact cards drop trailing colon per approved text).
- Bullets: `- (มาตรา N) …` · sub-bullets = 2-space indent `  - …`.
- Wikilinks `[[มาตรา N]]` to law articles — MUST keep intact in replaced cards; target must exist in `content/lawlib/laws/<slug>.md`.
- Untouched cards: byte-for-byte (never "improve"); only edited cards change.
- Status line (line 4): `> Status: **COMPLETE (YYYY-MM-DD)** — user one-by-one review SIGNED (density + content); N cards`.

## C. Amendment-tooltip markers (laws md) — CRITICAL placement rule

- Marker line: `> แก้ไขเพิ่มเติมโดยฉบับที่ N <note>` (also วรรค/เพิ่ม/เพิ่มเติม variants). Parser: `AMENDED_BY_RE`, parsed → `article.amendedBy` → LawTooltip `.lawlib-amendment-notes`.
- **PLACEMENT (the #1 bug):** marker attaches to the article whose content BLOCK contains it.
  - Before `**มาตรา N**` header → attaches to PREVIOUS article (WRONG).
  - Between `## หมวดที่` heading & article header → **silently DROPPED** (no validation error!).
  - ✅ CORRECT: marker = LAST line inside the target article block, blank line before next header (or directly after the affected วรรค).
- **validate does NOT catch mis/non-attachment** (rules 5/10 only check edition number + grammar). ALWAYS verify with a parse dump before sign-off:
  `parseLawMarkdown(md)` → print `article.amendedBy.editionNo` per article; confirm expected attachment only.
- **editions schema**: `amendedBy.editionNo` must ∈ `editions[]` (frontmatter, sequential 1..n; rule 5). Foreign/sub-law amendments NOT in the act's editions → add next sequential `no:` + note `"กฎหมายภายนอก / กฎ ก.ค.ศ. — มิใช่การแก้ไข พ.ร.บ."`. User-accepted tradeoff: EditionTimeline labels it "ฉบับที่ N". (ADR-external-act-editions.)
- Law #7 pattern: external act (ฉ.19/2562) = edition no:3 + 3 markers (มาตรา 4/11/22). Law #8: ก.ค.ศ. salary = edition no:4 + 1 marker (มาตรา 3).

## D. Apply lane (junior-engineer) intake requirements

Pass EXACT final texts verbatim (never paraphrase). Include:
1. File list (digest + optional laws md).
2. Per change: REMOVE / REPLACE [exact text] / EDIT-old→new / ADD.
3. Status-line exact text.
4. Verify block (junior must run): card count `grep -c '^\*\*มาตรา'` equals expected · forbidden-remnant grep = 0 · untouched-cards byte-check vs pre-edit read · wikilink targets exist in laws md · for laws-md changes: parse-dump of amendedBy attachment + `scripts/lawlib/validate.ts <file>` + unit tests (parser/validate/tooltip) · prettier --check (stdin-forced).
5. Constraints: ONLY listed files · no git · no build · no other repo writes · no laws md changes unless scoped.

## E. Schema-touching gate

- Laws-md editions/marker changes = **schema-touching** → senior-engineer review (findings incl. stale built JSON) + verify gate.
- Digest-text-only = junior + verify (no senior).
- **After any laws-md change: run `npm run lawlib:build`** — `npm run build` (Next) does NOT regenerate `src/data/lawlib/laws/*.json`. Verify built JSON end-state (editions + amendedBy) post-build. lawlib:build rewrites all JSONs (idempotent; may surface pre-existing source drift — build artifacts, commit with feature).

## F. Completion

Verify PASS for all. Update `.agents/tasks/todo.md` (mark COMPLETE, note schema lanes + follow-ups). Report queue table to user. Capture to `.agents/memory.md`; offer Obsidian + follow-up tickets.
