# Rule: Session Capture

Source: @ AGENTS.md Session End & Context Hygiene

## Session End & Context Hygiene

Run `/capture <summary>` → `.agents/memory.md` + `obsidian-vault/boss-project/` + `.agents/report/report-{date}.md`.
What to capture: decisions (why, alternatives rejected), bugs (root cause, fix), patterns, gotchas.
Where it goes: local `.agents/memory.md` | Obsidian vault `obsidian-vault/boss-project/` | session report.
Prompt efficiency: targeted reads (grep/glob → Read offset/limit, never >300L blind); batch edits; snip run -- for heavy cmds (`npm run typecheck/lint/eval/build`, `opencode2 api get`, `docker`, `curl`, `jq`); subagent contracts ≤60L (refs not pastes); artifacts over re-explanation; brain-caller ≤150L/30d.
Context hygiene: use subagents for investigation (separate window); /clear between unrelated tasks; treat AGENTS.md like code — prune when rule ignored; mark single line only if repeatedly skipped.
Verify agnostic — `npm run build` not just lint — show output, don't assert.
Context-engineering: load only needed spec sections/files per task, not whole spec.
