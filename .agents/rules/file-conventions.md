# Rule: File Conventions

Source: @ AGENTS.md File Conventions & Imports

## File Conventions & Imports

- Artifacts under `.agents/` (never `~/.opencode/`). Plans `.agents/plans/` | Reports `.agents/report/` | Memory `.agents/memory.md` | Tasks `.agents/tasks/todo.md`
- Artifacts: `.agents/report/` keeps newest 12 session reports + latest eval → rest archive.
- LawLib digest rules → `.agents/plans/digest-apply-rules.md`
- Spec skill gated flow: SPECIFY→PLAN→TASKS→IMPLEMENT, interview via AskUserQuestion for ambiguous >30min features.
- Commit Convention: enforced by `.husky/commit-msg` → `scripts/commit-msg-check.mjs` (ADR-022). Cheat sheet → `@.agents/plans/commit-convention.md` (full grammar, types, refs, release form)
- Subagent Orchestration: pipeline ORIENT→Explore→Plan→Build→Deploy→Monitor→Report. See `@.agents/subagent-orchestration.md` (compact form + trigger table + anti-patterns)
- Imports use `@` syntax (Claude docs) — fallback one-liner ensures opencode without import still finds convention.
- Operating behaviors: surface assumptions, manage confusion (ask), push back, keep simple, stay in scope, verify with evidence, plan agents don't implement — ask `approve/improve/wait`.
