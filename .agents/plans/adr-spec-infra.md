# ADR — Spec Infrastructure (D3 / D4 / D5 / D6)

**Date:** 2026-08-20 · **Status:** Accepted (REVISED plan `spec-infra-harness-70-plan.md` + senior REVISE + scrutiny 10 loops)
**Plan:** `.agents/plans/spec-infra-harness-70-plan.md` REVISED · **Specs:** `.agents/specs/spec-infra.md` (APPROVED) + `.agents/specs/harness-70.md` (APPROVED)
**Scope:** `.agents/specs/` as living spec layer — TEMPLATE budget, harness weight, lint ignore, gitignore trackability. Zero runtime cost.

## Context

After `vocab-category-restructure.md` (legacy, pre-template) the repo had no spec template/index/ADR layer. `spec-infra.md` + `harness-70.md` were approved 2026-08-20 but `.agents/*` in `.gitignore:84` blocked tracking of specs/ADRs, `opencode.json:61` blocked MCP fix, and harness checks used fragile `content.includes('"mcp"')` (Loop 4). Four decisions remained before `opencode.json` 70/70 fix: TEMPLATE gate definition (D3), optional harness specs check weight (D4), eslint ignore retention (D5), and `.gitignore` handling (D6). All are config/docs — 0 DB queries, pool 3 unchanged, local-only until VisperHost (ADR-013).

Scrutiny history: Loop 6 clarified TEMPLATE vs instantiated spec length budgets; Loop 10 locked maxScore 70 preservation; Loops 2/4/5 drove D6/D1/D2 (tracked in `adr-harness-70.md`).

## Decisions

### Overview

| Decision | Title | Choice |
|----------|-------|--------|
| D3 | TEMPLATE skeleton budget | **<60 lines, budgets separated — skeleton <60L, instantiated specs 100–200L** |
| D4 | Harness `ctx_specs_dir` weight | **weight 1 advisory, `repo` scope only, normalized to 10/10 (keep max 70)** |
| D5 | ESLint ignore for harness | **keep `globalIgnores` for `scripts/harness-audit.js` + `.agents/**`** |
| D6 | Gitignore trackability | **`!` negations + `git add -f` fallback** |

### D3 — TEMPLATE <60 skeleton (budgets separated) — Loop 6 rationale

**Choice:** TEMPLATE skeleton **<60 lines** (`wc -l <60` + `grep -c "^## " >=8`), instantiated specs typical **100–200L** (harness-70 143L, spec-infra 171L). Budgets are separated — skeleton gate ≠ spec gate.

**Why:** Skill `spec-driven-development` requires 6 core areas + Boundaries + Success + Open Questions + Assumptions block. Skeleton <60L keeps copy in <1 min. Instantiated specs need 100–200L to carry WHAT/WHY + success criteria — applying <60 to them would starve context.

**Loop 6 rationale:** Early REVISED plan used <70 ambiguous (skeleton vs full spec conflated). Scrutiny Loop 6 split budgets: TEMPLATE <60 unified + `grep -c "^## " >=8` for completeness, while `README 80–150L` and specs 100–200L document the overflow. Gate is now deterministic.

| Pros | Cons |
|------|------|
| Deterministic gate (`wc -l` + `grep`) — no reviewer guess | Instantiated specs look "over budget" if reader conflates gates |
| Template stays copy-paste ready (<1 min) | Requires doc note separating budgets (added to TEMPLATE + README) |
| 8 headers guarantee completeness (Assumptions + 6 areas + Boundaries + Success + Open Q + Risks) | — |

**Rejected:** `<70 ambiguous gate` — conflated skeleton vs instantiated spec, made verify flaky; `>60 skeleton` — template too heavy, skipped for "simple" tasks.

**Verify:** `wc -l .agents/specs/TEMPLATE.md` <60; `grep -c "^## " .agents/specs/TEMPLATE.md` >=8; `cp TEMPLATE.md /tmp/test-spec.md` succeeds.

### D4 — Harness `ctx_specs_dir` weight 1 advisory, repo-only — Loop 10 rationale

**Choice:** Optional check `ctx_specs_dir` — `id: 'ctx_specs_dir', category: 'ctx', weight: 1`, `repo` scope only, check `glob('*.md', '.agents/specs') length>=1`. Normalized to **10/10 Context Efficiency** by splitting `ctx_plans_dir` 2→1 so total stays 10 and **maxScore stays 70** (70/70 CI string preserved). `skills`/`hooks`/`agents` scopes unchanged.

**Loop 10 rationale:** Senior REVISE + Loop 10 showed weight 2 would push Context 10→11 and repo max 70→71/72, breaking `70/70` CI string (plan §10 open question). Weight 1 advisory makes spec infra measurable without immediate red; `repo`-only scope avoids inflating `skills 20/20` or `hooks 20/20`. Normalization (2→1 split) keeps max 70 without changing harness rubric.

| Pros | Cons |
|------|------|
| Measures spec infra (like `ctx_plans_dir`) without blocking green | Adds one more check to maintain (glob) |
| Keeps 70/70 string stable — no CI/doc churn | Weight 1 is advisory — could be ignored if team wants stricter gate later |
| Repo-only avoids scope creep (skills/hooks stay 20/20) | Requires weight split (plans 2→1) — documented, but non-obvious |

**Rejected:** weight 2 immediate — changes max to 71/72, breaks `70/70` string; weight 0 (no check) — spec infra unmeasured, drift risk.

**Verify:** `node scripts/harness-audit.js repo --format json | jq '.categories[] | select(.name=="Context Efficiency")'` shows 6 checks, 6/6 pass, score 10.0/10, maxScore 70 (if added).

**Gated:** Ask human before adding (T7, optional polish) — not in P3.

### D5 — Keep ESLint `globalIgnores` for harness + `.agents/**`

**Choice:** Keep `eslint.config.mjs:17` `globalIgnores` entry: `['scripts/harness-audit.js', '.agents/**', ...]` — harness audit file not app code, specs are markdown.

**Why:** `scripts/harness-audit.js` is Node harness (671L, no deps, rubric 2026-03-30) — linting it as app code adds noise, not value. `.agents/**` is markdown/plans — excluded by design (same as `scripts/` was). Build/typecheck ignore aligns: specs don't affect `npm run build`.

| Pros | Cons |
|------|------|
| `npm run lint` stays green without touching harness | Harness lint errors hidden — intentional (not app code) |
| Consistent with `.agents/**` ignore (specs are docs) | If harness were TS, would want lint — but it's JS, no deps |
| Zero churn on eslint config | — |

**Rejected:** Remove ignore — would force `eslint --fix` churn on harness, no benefit; add override for harness only — more config for same outcome.

**Verify:** `npm run lint` passes; `grep -c "harness-audit" eslint.config.mjs` >=1.

### D6 — Gitignore negations + `git add -f` fallback

**Choice:** Add `!` negations after `.gitignore:84` + keep `git add -f` fallback for verification:

```gitignore
!.agents/specs/
!.agents/specs/*.md
!.agents/plans/adr-*.md
!scripts/harness-audit.js
!opencode.json   # after opencode.json line :61
```

Plus `!.agents/` + `.agents/*` base already present (T4b). Verify via `git check-ignore -v <path>` empty (not ignored) before + after `git add`; fallback `git add -f` covers fresh clones where negations not yet committed.

**Why:** `.agents/` and `opencode.json` are ignored by default (`.agents/*` + `opencode.json` line). Without negations, specs/ADRs/opencode/harness require `git add -f` every time → `git status` noisy, easy to miss. Negations make `git status` clean (`??` → `A` after `git add`), while `add -f` remains safety net during P0 transition.

**Loop 2 rationale:** Early plan used `add -f` only (Loop 2). Scrutiny Loop 2 added negations as primary + `add -f` fallback (REVISED §4 Phase 0 + §10 Decision Record: "rejected add -f only (status noisy)"). Both are now documented.

| Pros | Cons |
|------|------|
| `git status` clean — specs visible as untracked, not `!! ignored` | More `.gitignore` lines (4 negations) |
| `git check-ignore -v .agents/plans/adr-*.md` empty after unignore (trackable) | Requires parent `!.agents/` + `!.agents/plans/` chain — ordering matters |
| `git add` works without `-f` after merge | Transition still needs `-f` until negations land |
| Rejected `docs/specs/` (not agent-native) — `.agents/specs/` consistent with agent memory/plans | — |

**Rejected:** `docs/specs/` — not agent-native, build-visible; `add -f` only — noisy status, error-prone.

**Verify:** `git check-ignore -v .agents/plans/adr-spec-infra.md` empty (negation covers `adr-*.md`); `git check-ignore -v .agents/specs/README.md` empty; `git check-ignore -v opencode.json` empty; `git ls-files --error-unmatch <path>` passes after `git add` (or `git add -f` during transition).

## Alternatives Considered (summary)

| Decision | Rejected | Reason |
|----------|----------|--------|
| D3 | <70 ambiguous | Splits budgets, flaky gate (Loop 6) |
| D4 | weight 2 immediate | Breaks max 70 → 71/72 (Loop 10) |
| D4 | no check (weight 0) | Spec infra unmeasured |
| D5 | remove ignore | Noise, no value |
| D6 | `docs/specs/` | Not agent-native |
| D6 | `add -f` only | Status noisy (Loop 2) |

## Consequences

- TEMPLATE copy <1 min; instantiated specs 100–200L typical — verify gates separated.
- Harness optional weight 1 keeps 70/70 stable; team can upgrade to weight 2 later if `71/71` accepted.
- Lint stays green; harness not linted by design.
- Git tracking clean: `ls .agents/specs/*.md` = 4 files (harness-70, spec-infra, README, TEMPLATE); `ls .agents/plans/adr-*.md` = 2+ new ADRs; `git ls-files` passes.
- No runtime cost: docs + config, 0 DB queries, pool 3 unchanged, <100ms local.

## Verification

```bash
# D3
wc -l .agents/specs/TEMPLATE.md          # <60
grep -c "^## " .agents/specs/TEMPLATE.md # >=8

# D4
node scripts/harness-audit.js repo --format json | jq '.categories[] | select(.name=="Context Efficiency")'

# D5
npm run lint                             # pass, harness ignored
grep -c "harness-audit" eslint.config.mjs

# D6
git check-ignore -v .agents/plans/adr-spec-infra.md  # empty (negation covers adr-*.md)
git check-ignore -v .agents/specs/README.md           # empty
git check-ignore -v opencode.json                     # empty
git ls-files --error-unmatch .agents/plans/adr-spec-infra.md  # after git add / add -f
git ls-files --error-unmatch .agents/specs/README.md

# This ADR
grep -c "D3\|D4\|D5\|D6" .agents/plans/adr-spec-infra.md  # >=4
ls -lh .agents/plans/adr-spec-infra.md
```

Fallback if negations not yet committed: `git add -f .agents/plans/adr-spec-infra.md` then `git ls-files --error-unmatch`.

## Related

- Specs: `.agents/specs/spec-infra.md` §8 Success Criteria — D3/D4/D5/D6 listed; `.agents/specs/harness-70.md` §8 — D1/D2/D6
- Plan REVISED: `.agents/plans/spec-infra-harness-70-plan.md` §3 D3/D4/D5/D6 + §10 Decision Record + SDO §10 (Persist to `adr-spec-infra.md` + `adr-harness-70.md`)
- Implementation Plan: `.agents/plans/implementation-plan-spec-infra-harness.md` Task 4 (this file)
- ADRs: `adr-harness-70.md` (D1/D2/D6) — companion; `adr-013-hosting-migration-visperhost.md` (no VPS)
- Loops: Loop 6 (TEMPLATE vs spec length, D3 <60) · Loop 10 (max 70, D4 weight 1) · Loop 2 (D6 negations) · Loop 4/5 (D1/D2 in companion ADR)
- Skills: `spec-driven-development` (TEMPLATE source)

## Resource Cost

+1 markdown ~5KB, 0 deps, 0 DB, Read 0.1ms, `node harness` <100ms, `npm run build` unchanged (md ignored via `.agents/**`).

---
*ADR maintained by senior-engineer. Human approves transitions. Last sync: 2026-08-20.*
