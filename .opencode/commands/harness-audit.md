---
description: Run a deterministic repository harness audit across 7 categories (Tool Coverage, Context Efficiency, Quality Gates, Memory Persistence, Eval Coverage, Security Guardrails, Cost Efficiency). Returns scorecard with failed checks and top actions.
---

Run `node scripts/harness-audit.js [scope] [--format text|json] [--root <path>]`

## Scopes
- `repo` (default) — all 7 categories, max 70pts
- `hooks` — Quality Gates + Security Guardrails, max 20pts
- `skills` — Tool Coverage + Context Efficiency, max 20pts
- `commands` — Tool Coverage (commands check), max 10pts
- `agents` — Tool Coverage (agents) + Memory Persistence, max 20pts

## Flags
- `--format text|json` — output format (default text)
- `--root <path>` — target directory (default cwd)

## Examples
- `/harness-audit`
- `/harness-audit hooks --format json`
- `/harness-audit --root /path/to/project`
