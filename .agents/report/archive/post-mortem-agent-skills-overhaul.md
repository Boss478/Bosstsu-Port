# Post-Mortem: Agent Skills Overhaul

**Date:** 2026-06-18
**Type:** Configuration optimization
**Severity:** Enhancement (no bug)

## Summary

Integrated addyosmani/agent-skills into Boss478 OpenCode setup. Reduced skills from 113 to 90 by removing 25 irrelevant skills and archiving 11 low-frequency ones. Added 18 curated skills (6 core + 12 extended) and 5 new subagents for specialized workflows.

## What Changed

| Layer | Before | After |
|-------|--------|-------|
| Skills | 113 (user-level) | 90 active + 11 archived |
| Commands | 21 (global) | 21 (unchanged — user didn't want new commands) |
| Subagents | 14 (global) | 14 (5 added to project-level opencode.json) |
| Token waste/session | ~3-12K | eliminated |

### Skills Removed (25)
Blockchain (4), Kotlin (5), Scientific (5), Healthcare (2), Platform-specific (2), ECC bloat (6), Compose (1)

### Skills Archived (11)
Java (5), Swift (4), Django patterns (1), Laravel (1) — moved to `.agents/archived-skills/`

### Skills Added (18)
| Wave | Skills | Source |
|------|--------|--------|
| 1 — Core | `spec-dev`, `plan-task`, `implement-task`, `test-driven-development`, `review`, `ship` | addyosmani |
| 2 — Extended | `doubt-driven-development`, `source-driven-development`, `code-simplification`, `security-and-hardening`, `frontend-ui-engineering`, `browser-test`, `debug`, `context`, `git-workflow-and-versioning`, `docs-adr`, `ci-cd-and-automation` + merged `performance-optimization` into `web-performance` | addyosmani |

### Subagents Added (5)
`spec-writer`, `builder`, `test-engineer`, `simplifier`, `webperf-auditor`

## Root Cause

Initial OpenCode setup loaded 113 skills indiscriminately, including ~25 with zero relevance to a Next.js/TypeScript portfolio + educational games project. Each session paid the token cost of loading these skills despite never using them.

## Fix

1. **Audit:** Categorized all 113 skills into Keep / Archive / Remove
2. **Source:** Cloned `addyosmani/agent-skills` to `~/.opencode/agent-skills/`
3. **Curate:** Added 18 skills that fill gaps in the existing workflow (spec work, task breakdown, implementation, TDD, code review, shipping)
4. **Replace:** Upgraded 3 weaker existing skills (tdd-workflow → test-driven-development, code-review → code-review-and-quality, security-review → security-and-hardening)
5. **Subagents:** Added 5 subagents with restricted tool permissions that map to specific workflow phases

## Verification

- `npm run build` — clean pass
- `npm run lint` — clean pass
- Skills count: 113 → 90
- Archived skills verified at `.agents/archived-skills/`

## How It Slipped Through

No prior systematic audit of loaded skills existed. ECC bundle installed everything without relevance filtering.

## Action Items

- [x] Skills inventoried and categorized
- [x] Irrelevant skills removed from user-level
- [x] Low-frequency skills archived to project dir
- [x] Addyosmani skills integrated
- [x] Subagents configured with tool permissions
- [x] AGENTS.md updated
- [x] Project memory updated
