# Rule: Workflow

Source: @ AGENTS.md Workflow — Explore → Plan → Build → Verify

## Workflow — Explore → Plan → Build → Verify

Gated: SPECIFY → PLAN → TASKS → IMPLEMENT. Plan Mode before code for >30min / >1 file / multi-module.
Explore (subagents) → Plan (manager+senior) → Build (junior) → Verify (deterministic gate).
Explore via subagents (explore, researcher, docs-lookup separate window, summary back) to keep main context clean — no code touched.
Use subagents for investigation — they explore in separate context, keep main clean for implementation.
Plan: manager (requirements/stories, broad review) + senior-engineer (technical scope, depth, cost) → user approves → Build.
Plan agents don't implement — they plan/design in `.agents/**` only, ask `approve/improve/wait`.
Build: junior-engineer per Task-Intake Contract (≤60L refs, not pastes) — may use explore/researcher/docs-lookup/brain-caller.
Build covers scoped tasks to reviewable standard; senior-engineer reviews and directs.
Trivial changes (typo/NIT/one-liner, scoped one-liner) → fast path implement → verify only; if ambiguous ask user.
See `@.agents/specs/README.md` + `@.agents/subagent-orchestration.md`.
