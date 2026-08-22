# Rule: Testing

Source: @ AGENTS.md Verification Gate + Dev Commands + memory

## Testing

- Eval harness `.agents/evals/*.md` — `npm run eval -- <feature>` → `.agents/report/eval-*.md` (capability + regression pass^3=1.00).
- Vitest split `vitest.unit.config.ts` + `vitest.db.config.ts` (pool 3, batch 50-100).
- Playwright 52+9 lawlib, k6 p95.
- Gate: `npm run typecheck` + `npm run lint` + `npm run build` must pass (verify agnostic).
- Success Criteria: command + expected signal (metric, not "faster") e.g. `npm run eval -- auth green`.
- Show evidence (command + output / screenshot), don't assert.
- Per phase exit has a check Claude can run before human review — stop hook analog.
- No ship without verify.
- Inventory guard for explicit-include configs (check-test-inventory).

## Eval Report

- `.agents/report/` keeps newest 12 session reports + latest eval → rest archive.
