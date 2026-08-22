# Rule: Verification

Source: @ AGENTS.md Verification Gate (IMPORTANT) + Completion Protocol

## Verification Gate (IMPORTANT)

Give Claude a check it can run. Every feature needs verifiable Success Criteria — not vague.
Must pass: `npm run build` + `npm run typecheck` + `npm run lint` + `npm run eval -- <feature>` or screenshot diff.
Criteria examples: `Dashboard LCP <2.5s`, `npm run eval -- auth green`, route baseline pass^3.
Claude runs check, reads result, iterates until green. Show evidence (command + output / screenshot), don't assert.
No ship without verify. Verify agnostic — `npm run build` not just lint.
Per phase: each exit has a check Claude can run before human review — stop hook analog.
Success Criteria must list command + expected signal (metric, not "faster").
Example: `npm run typecheck` green + `npm run eval -- grading` pass.

## Completion Protocol

1. `npm run build` must pass clean
2. Ask before bumping version (minor patch default)
3. Update `changelog.md` (`+`/`*`/`-`)
4. `package.json` version must match latest changelog
5. Ask about post-mortem
6. Keep pool 3, rate limit 5 logins/15min, concurrency 50-100 — verify not changed.
