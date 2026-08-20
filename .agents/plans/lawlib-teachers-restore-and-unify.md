# Implementation Plan: Restore Teachers Laws + Complete History Unification (T6/T9)

## Overview
Two teachers laws (`teachers-educational-personnel-civil-service-act-2547.md` and `teachers-council-educational-personnel-act-2546.md`) are missing from `content/lawlib/laws/` (never committed, not on disk). They block T6 (12 markers, คสช.10/2559 + 16/2560) and T9 (6–8 markers, คสช. 7/2558+17/2560+11/2561). Goal: restore both law md files (and their digests if missing) from authoritative source, then unify their history to ADR pattern (external→sequential edition+marker) and keep 6-law unified state intact. Static content only, same constraint envelope as prior plan.

## Architecture Decisions
- **Source of truth for restore:** PDF/official Gazette if available; fallback is `src/data` JSON reverse-engineer is NOT authoritative. If PDF unavailable, reconstruct from `planned-laws.json` + existing digest §2 + Gazette websearch, but flag as `verifiedAt` pending researcher recheck.
- **Restore = verbatim law text:** Do NOT edit history during restore; first commit is pure restore (no editions/markers), second commit is history unification. Keeps diff reviewable.
- **Same ADR pattern:** External คสช. = next sequential `editions[].no` with note `กฎหมายภายนอก: ... (มิใช่การแก้ไข พ.ร.บ.)` + verbose marker `> แก้ไขเพิ่มเติมโดยฉบับที่ N ฉบับที่ N (YYYY) - ยกเลิก/แก้ไข:` inside target article. Digest §2 header count == law editions.
- **Validate guard stays live:** `validateLawMarkdown` (Guards A+B) must pass for both restored laws before and after unification.
- **Build order:** `lawlib:build` after each law restore/unify to regenerate `src/data/lawlib/*.json` + `index.json`/`registry.ts`.

## Task List

### Phase 1: Restore (no history edits)
*Goal: 2 law md + 2 digest md present and build-clean before touching history.*

#### Task 1: Restore Teachers-Civil 2547 law md
**Description:** Locate authoritative source for `teachers-educational-personnel-civil-service-act-2547` (PDF at `~/Downloads` or Gazette). Convert to `content/lawlib/laws/teachers-educational-personnel-civil-service-act-2547.md` with correct frontmatter (slug, code, titleTh, subject, part, tags, verifiedAt, gazetteRef, editions 1..4 as currently documented in digest §2 before unification) and 141 articles. No edition/marker changes yet.
**Acceptance criteria:**
- [ ] File exists at `content/lawlib/laws/teachers-educational-personnel-civil-service-act-2547.md`, parses via `parseLawMarkdown` without throw
- [ ] `validateLawDoc` 0 errors (except history gaps, which are pre-existing)
- [ ] `lawlib:build --check` shows `teachers-educational-personnel-civil-service-act-2547 — 141 มาตรา` OK
**Verification:**
- [ ] `npx tsx -e "parseLawMarkdown(readFileSync(...))"` no throw, articleCount 141
- [ ] `npm run lawlib:build -- --check` OK
**Dependencies:** None
**Files likely touched:**
- `content/lawlib/laws/teachers-educational-personnel-civil-service-act-2547.md`
**Estimated scope:** M (1 file, 141 articles)

#### Task 2: Restore Teachers-Council 2546 law md
**Description:** Same for `teachers-council-educational-personnel-act-2546` (90 articles). Restore to `content/lawlib/laws/teachers-council-educational-personnel-act-2546.md`.
**Acceptance criteria:**
- [ ] File exists, parses, 90 articles, build OK
**Verification:** Same as Task 1
**Dependencies:** None (parallel with Task 1)
**Files likely touched:**
- `content/lawlib/laws/teachers-council-educational-personnel-act-2546.md`
**Estimated scope:** M (1 file, 90 articles)

#### Task 3: Restore/verify digests for both teachers laws
**Description:** Ensure `content/lawlib/digests/teachers-*.md` exist and have §2 matching law editions pre-unify (header counts, entries). If missing, create from digest program backup or from law §2. No history unification yet.
**Acceptance criteria:**
- [ ] Both digest files exist, `## 2. ประวัติการแก้ไข` header present, `hasDigest` true in build log
**Verification:**
- [ ] `npm run lawlib:build` shows `[DIGEST] teachers-...: compact view available` for both
**Dependencies:** Tasks 1, 2
**Files likely touched:**
- `content/lawlib/digests/teachers-educational-personnel-civil-service-act-2547.md`
- `content/lawlib/digests/teachers-council-educational-personnel-act-2546.md`
**Estimated scope:** S (2 files)

### Checkpoint: Restore
- [ ] Both law md files present, parse + validate 0 (pre-unify), `lawlib:build --check` 8 laws OK (6 previous + 2 restored)
- [ ] `npm run build` SSG 8 lawlib paths
- [ ] Review with human: restored text matches source (spot check 2 articles)

### Phase 2: History Unification (same pattern as T4/T5/T7/T8)
*Independent vertical slices; parallel after checkpoint.*

#### Task 4: T6 — Teachers-Civil 2547 คสช.10/2559 + 16/2560 → no5/no6
**Description:** Convert 2 คสช. orders: 10/2559 (ยกเลิก มาตรา 21) strikethrough → `editions no5` + marker on ม21; 16/2560 (11 มาตรา `ขั้นเงินเดือน→เงินเดือน`, พ้นตำแหน่ง ก.ค.ศ., อ.ก.ค.ศ.วิสามัญ 3 คณะ, งดใช้ ม47/54) digest-only → `editions no6` + markers on each of the 11 affected articles (research Gazette for exact list, currently in digest §2). Update digest §2 `(4 ฉบับ)` → `(6 ฉบับ)` with no5/no6 entries.
**Acceptance criteria:**
- [ ] Law `editions.length` 6, มาตรา21 `amendedBy` has ed5, 11 articles have ed6
- [ ] No `~~` คสช. strikethrough remains, raw==parsed
- [ ] Digest §2 6 entries, count==law
**Verification:**
- [ ] Parse dump 12 markers, `validateLawMarkdown` 0, `lawlib:build --check` OK, senior review
**Dependencies:** Tasks 1,3; needs Gazette research
**Files likely touched:**
- `content/lawlib/laws/teachers-educational-personnel-civil-service-act-2547.md`
- `content/lawlib/digests/teachers-educational-personnel-civil-service-act-2547.md`
**Estimated scope:** M (2 files, 12 markers)

#### Task 5: T9 — Teachers-Council 2546 3× คสช. → no2/3/4
**Description:** Convert คสช. 7/2558, 17/2560, 11/2561 (affecting มาตรา 12/21/64 etc per digest §2) → `editions no2/3/4` + 6–8 markers on affected articles. Update digest §2 `(1 ฉบับ)` → `(4 ฉบับ)`.
**Acceptance criteria:**
- [ ] Law `editions.length` 4, each external's articles have correct `amendedBy`
- [ ] Digest §2 4 entries, count==law
**Verification:** Same as Task 4
**Dependencies:** Tasks 2,3; needs Gazette research
**Files likely touched:**
- `content/lawlib/laws/teachers-council-educational-personnel-act-2546.md`
- `content/lawlib/digests/teachers-council-educational-personnel-act-2546.md`
**Estimated scope:** M (2 files, 6–8 markers)

### Checkpoint: Complete
- [ ] All 8 laws `editions⊇markers` valid, no strikethrough/digest-only gaps, raw==parsed, `validateLawMarkdown` 0
- [ ] All digests §2 counts == law counts (6 previous + 2 teachers)
- [ ] `npm run lawlib:build -- --check` 8 laws OK, `npm run build` SSG 8 paths, `vitest` 70 pass
- [ ] Manual LawTooltip spot check (1 B + 1 C article)

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Source PDF not found / text extraction errors (Thai OCR) | High — wrong article text, legal misinfo | Search `ratchakitcha` Gazette PDFs; if unavailable, flag `verifiedAt` as `pending` and request human PDF |
| Gazette มาตรา list inaccurate (11 มาตรา for 16/2560, 3 orders for T9) | High — wrong tooltip | Researcher websearch + cross-check digest §2 vs Gazette before writing markers; senior review |
| Restore introduces formatting drift (headings, refs) | Med — build break | Use existing law md as template (frontmatter keys, `## หมวด`, `**มาตรา**`); run `parseLawMarkdown` + `validateLawDoc` before commit |
| Missing early-childhood/promotion remain built false | Low — not in scope, but final 10-law index incomplete | Document as out-of-scope; they are already SAME pattern |

## Open Questions
- Do you have PDFs for the 2 teachers laws (`~/Downloads` or drive) or should we websearch Gazette?
- Accept `verifiedAt` = restore date with note "pending Gazette recheck" if source is web-only?
- Keep early-childhood/promotion as built false (no action) or restore them as well for 10-law completeness?

## Parallelization
- Safe parallel: Tasks 1∥2 (disjoint files); Tasks 4∥5 after Checkpoint Restore (disjoint)
- Must be sequential: Task 3 after 1+2; each law's restore before its unify; `lawlib:build` after each phase
