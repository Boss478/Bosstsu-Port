# Spec: Spec Infrastructure — `.agents/specs/` as Source of Truth

> Gated workflow: SPECIFY → PLAN → TASKS → IMPLEMENT. Human reviews each gate.
> Status: APPROVED 2026-08-20 — senior REVISE incorporated (plan REVISED), awaiting Plan approval.
> Plan: `.agents/plans/spec-infra-harness-70-plan.md` REVISED.

## ASSUMPTIONS I'M MAKING — REVISED per senior review 2026-08-20:
1. Project uses spec-driven dev for >30min or >1 file — current `vocab-category-restructure.md` is only spec; no template/index.
2. Specs live in `.agents/specs/` (user decision) but **are gitignored** `.gitignore:84` `.agents/*` — Plan Phase 0 adds `!.agents/specs/` + `!.agents/specs/*.md` negations.
3. Specs are living docs, versioned in git (after negation), referenced in PRs.
4. Manager owns spec quality (WHAT/WHY), senior-engineer owns PLAN technical scope — both gate before Implement.
5. TEMPLATE skeleton must be **<60 lines** (unified, was <70 ambiguous) + `grep -c "^## " >=8` — single budget.
6. No new runtime deps; 0 CPU/memory cost.
→ Correct me now or I proceed with these.

## 1. Objective

**What:** Establish `.agents/specs/` as the durable spec layer: template + index + harness integration + lifecycle.
**Why:** Without specs, implementation is guessing. Harness Context Efficiency is 10/10 today because memory/plans exist, but spec coverage is unmeasured — future features (LawLib phase 2/3, Grammar Castle, KruLAW) will drift without acceptance criteria.
**Who:** PM (manager), senior-engineer, junior-engineer, verify — all read specs to align on "done".
**Success looks like:**
- `ls .agents/specs/` shows `README.md` + `TEMPLATE.md` + `harness-70.md` + existing `vocab-category-restructure.md` (migrated to template)
- Harness (or new check) can verify spec infra exists (like `plans` check)
- Every new feature >1 file has a spec before code (enforced via PR checklist + verify gate)

## 2. Tech Stack

- Markdown specs, no tooling beyond `node scripts/harness-audit.js` + `npm run lint` (specs excluded from lint)
- Template based on `spec-driven-development` skill template (6 core areas + boundaries + success + open questions)
- Reference: `/.agents/templates/system-design-overview.md` (for >1 file features, manager duty 4) stays separate — spec references SDO when needed.

## 3. Commands

```
List specs:   ls -la .agents/specs/
Validate:     node scripts/harness-audit.js skills --format text  # Context Efficiency includes specs? (proposed)
Lint:         npm run lint --fix  # specs are md, ignored via eslint globalIgnores
Build:        npm run build       # specs don't affect build
New spec:     cp .agents/specs/TEMPLATE.md .agents/specs/<feature>.md
```

## 4. Project Structure

```
.agents/specs/
  README.md                    → index: what specs are, lifecycle, gated workflow, links to all specs + ADRs
  TEMPLATE.md                  → canonical spec template (6 core areas, copy for new features)
  harness-70.md                → spec for harness remediation (this batch)
  spec-infra.md                → THIS SPEC
  vocab-category-restructure.md→ existing spec (migrate to TEMPLATE on next touch, not now)

.agents/templates/
  system-design-overview.md    → kept, referenced from specs when feature >1 file

.agents/plans/
  adr-spec-infra.md            → ADR for spec-infra decisions (naming, gating, harness integration)

.agents/tasks/todo.md          → backlog entries for spec-infra tasks (if needed)
```

Ignored in eslint: `.agents/**`, `scripts/harness-audit.js` (keep). Specs excluded from build.

## 5. Code Style

Template excerpt — one real snippet beats three paragraphs:

```markdown
# Spec: [Feature Name]

## ASSUMPTIONS I'M MAKING:
1. ...
→ Correct me now or I'll proceed.

## 1. Objective
[What/why/who/success]

## 2. Tech Stack
[Framework, deps with versions]

## 3. Commands
[Build/Test/Lint/Dev — full commands]

## 4. Project Structure
[Directory layout]

## 5. Code Style
[Example snippet + conventions]

## 6. Testing Strategy
[Framework, locations, coverage, levels]

## 7. Boundaries
- Always: [...]
- Ask first: [...]
- Never: [...]

## 8. Success Criteria
[Specific, testable — checkbox list]

## 9. Open Questions
[Anything unresolved]

## 10. Risks & Mitigations
| Risk | Mitigation |
```

Conventions:
- Filename: `kebab-case.md` (e.g., `lawlib-phase2.md`, `grammar-castle-p1.md`)
- Header `Status: DRAFT | APPROVED | IMPLEMENTING | DONE` at top (optional)
- `Assumptions` block FIRST, before Objective (per skill)
- Reframe vague requirements as success criteria (e.g., "faster" → LCP <2.5s)
- Keep **TEMPLATE skeleton <60 lines** (skeleton only); instantiated specs typical 100–200 lines (e.g., harness-70 143L, this spec 171L) — TEMPLATE budget ≠ spec budget; README 80–150L.
- Link to SDO for >1 file design depth (don't duplicate)

## 6. Testing Strategy

Framework: No unit tests for specs — verification is harness + human review + gates.

| Level | Where | What | Expect |
|-------|-------|------|--------|
| spec completeness | human review | 6 core areas + boundaries + success criteria present | checklist pass |
| structure | `ls .agents/specs/` | README + TEMPLATE exist, non-empty (>50 chars) | pass |
| git | `git check-ignore -v .agents/specs/README.md` + `git ls-files --error-unmatch` | not ignored, tracked | pass |
| harness | `node scripts/harness-audit.js skills --format text` | Context Efficiency 10/10 (or 10/10 with 6 checks if specs check added) | 10/10 |
| harness extra | `jq -e '.mcp.servers \| length==6'` + `jq -e '...external_directory... >=5'` (via harness-70) | opencode.json valid | pass |
| verify gate | `npm run build && npm run lint && npm run typecheck` | specs don't break build (md ignored via .agents/**) | pass |
| PR linkage | PR description | Links to `.agents/specs/<feature>.md#Success Criteria` | present |

If `ctx_specs_dir` added: weight 1 advisory, `repo` scope only, normalized to 10/10 (keep max 70 via splitting `ctx_plans_dir` 2→1) — see plan Loop 10 ADR.

## 7. Boundaries

- **Always do:** Write spec BEFORE code for >1 file or >30min tasks; surface assumptions at top; reframe vague "make X better" as measurable criteria; commit spec to git; reference spec in PR; update spec when scope changes.
- **Ask first:** Adding new spec template fields; changing spec location (`.agents/specs/` → `docs/specs/`); adding harness check for specs; migrating existing `vocab-category-restructure.md` to new template (content unchanged, formatting only).
- **Never do:** Commit code without spec for qualifying features; edit specs via shell heredoc with `; ` (snip hook corrupts — use Write/Edit tools); store secrets in specs; duplicate SDO content inside spec (link instead).

## 8. Success Criteria — REVISED

- [ ] `.agents/specs/README.md` 80–150 lines, gated workflow Mermaid, table of specs (harness-70/spec-infra/vocab-legacy) with Status+ADR links
- [ ] `.agents/specs/TEMPLATE.md` <60 lines, 6 areas + boundaries + success + open Q + assumptions, `wc -l <60` + `grep -c "^## " >=8`
- [ ] `.agents/specs/harness-70.md` template-compliant (proves template)
- [ ] `.agents/specs/spec-infra.md` template-compliant (self-documenting)
- [ ] `vocab-category-restructure.md` marked legacy in README
- [ ] `.agents/plans/adr-spec-infra.md` records D3 (<60) + D4 (weight 1 repo-only) + D5 (keep ignore) + D6 (gitignore negations)
- [ ] `git check-ignore -v .agents/specs/README.md` → no output, `git ls-files --error-unmatch .agents/specs/README.md` pass after add
- [ ] Human approves (question tool)
- [ ] `npm run build` + `lint` + `typecheck` clean
- [ ] `cp TEMPLATE.md new.md` <1 min

## 9. Open Questions

- [ ] Should harness add a `ctx_specs_dir` check (like `ctx_plans_dir`) — weight 2, checks `.agents/specs/*.md` ≥1? (Adds 2pts to Context Efficiency, would make spec infra measurable.)
- [ ] Should `TEMPLATE.md` include a `Diagrams` section for SDO linkage (Mermaid) or keep specs diagram-free (SDO owns diagrams)?
- [ ] Lifecycle badge: `Status: DRAFT→APPROVED→IMPLEMENTING→DONE` vs git history alone — keep badge?
- [ ] Should specs be required for `hooks`/`skills`/`commands`/`agents` harness scopes, or only `repo`?
- [ ] Who approves spec gate — manager + senior-engineer dual, or human alone? (Skill says human reviews each gate; manager broad + senior technical.)

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Specs become stale (code diverges) | Living doc value lost | Rule: update spec BEFORE code when decisions change; verify gate checks spec link in PR |
| Template too heavy → skipped | Spec skipped for "simple" tasks | Template is <60 lines skeleton; trivial fixes (typo, one-liner) explicitly exempt per skill |
| Snip hook corrupts spec files | `; ` inserts `snip` tokens | Always use Write/Edit tools for specs, never shell heredoc/echo |
| Harness check for specs creates false fail | Repo flagged red for missing spec | Make check weight 1 (advisory) or gate behind `repo` only, not `hooks` etc |

## 11. Next Phase: Plan

After human approves this spec + `harness-70.md`:
- Plan: ordered tasks (README → TEMPLATE → ADR → optional harness patch), file-disjoint, estimates, dependencies, verification per task.
- Tasks: ≤5 files per task, explicit AC, verify commands.
- Implement: one task at a time, incremental + TDD where applicable, context-engineering (load spec section, not whole spec).

Related: `harness-70.md` is the first consumer of this infra — its Plan will reference this spec's TEMPLATE.
