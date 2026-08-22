# Commit Convention — Boss478

> Source @ AGENTS.md Commit Convention, ADR-022
> Validator is source of truth: `scripts/commit-msg-check.mjs` (zero deps, `.husky/commit-msg` → `scripts/commit-msg-check.mjs`)
> This file is the `@import` cheat sheet for `@.agents/plans/commit-convention.md` — copy verbatim from AGENTS.md lines 32-79.

---

## Commit Message Convention

Enforced by the `commit-msg` hook (`.husky/commit-msg` → `scripts/commit-msg-check.mjs`, zero deps — ADR-022). Applies to **everyone, all branches** (agents + manual commits). Invalid messages are blocked with teaching output. Source of truth = the validator script; this section is the cheat sheet.

### Grammar (v3.1)

```
<type>: <description> (<ref1>; <ref2>; …)   subject — ref group OPTIONAL, must be at the very end
<blank line>                                required if a body exists
<body — free-form, line length advisory ≤100>
```

- **Types (13, lowercase enforced):** `feat fix docs style refactor perf test build ci chore revert infra release`
- **No scope** — `feat(krulaw):` is retired; module/task context moves to the end ref group: `feat: digest pairing (T25; krulaw)`
- **Breaking:** `feat!: …` allowed (same for other types)
- **Refs (optional, `;`-separated):** task `(T23)` · issue `(#42)` · PR `(PR-7)` · module label `(krulaw)`
- **Release — THE form:** `release: (vX.Y.Z) <details>` — e.g. `release: (v1.13.0) content-surface glass`. Old `Release vX.Y.Z:` / `vX.Y.Z:` patterns stay exempt for **history compat only** (not a current style)
- **Micro-rules:** no trailing `.` on the subject · no leading/trailing whitespace · blank line before body (warning only) · subject >72 chars = advisory warning only (no hard fail — dense bilingual house style)
- **Exempt (auto-pass):** `Merge …`, `fixup!`, `squash!`, `Revert "…"`
- Advisory warnings print **TTY-only** (silent in CI/pipes); `--advisories` forces them (compliance reporting)

### Real → new conversions (compliance report, 5 real commits)

| # | Old (real) | New (convention) |
|---|---|---|
| 1 | `T23: Focus mode + Auto Scroll as dock tools (L2 + pin-able L1, …)` | `feat: focus mode + auto scroll as dock tools (T23)` — details move to body |
| 2 | `feat(krulaw): P7 reader cards — TOC + content card, print chrome strip (FR-G)` | `feat: P7 reader cards — TOC + content card, print chrome strip (FR-G; krulaw)` |
| 3 | `Fix: dock bottom positions restore BackToTop clearance (…)` | `fix: dock bottom positions restore BackToTop clearance (…)` |
| 4 | `v1.10.81 — Class Tools: admin full results + cleanup batch` | `release: (v1.10.81) Class Tools — admin full results + cleanup batch` |
| 5 | `docs(changelog): v1.11.0 reading-redesign entries (Wave 3)` | `docs: v1.11.0 reading-redesign entries (Wave 3)` |

### Migration mappings

| Old (retired) | New |
|---|---|
| `T23: x` | `feat: x (T23)` |
| `feat(krulaw): x` | `feat: x (krulaw)` |

### Notes

- **Imperative style** for descriptions: `feat: add focus mode`, not `feat: added focus mode` (documented, not mechanically enforced)
- **Refs are linking-only** — they never auto-close issues. Auto-close via body trailer: `Closes #42`
- **Jira:** keys are ≥2-letter project keys + `#command` form (e.g. `KRULAW-42` → `(KRULAW-42)`); not validated by the hook (free-form)
- **Changelog tooling:** `changelog.md` is hand-maintained — the validator does not check it (bodies/footers are free-form)
- **TH/EN:** one language per subject line
- **Bypass (discouraged):** `git commit --no-verify` skips the hook for emergencies
- **Footgun — never run `npx husky <arg>`:** husky 9.1.7 treats argv[2] as the hooks dir and corrupts `core.hooksPath` (all hooks die). Repair: `git config core.hooksPath .husky/_`. `npx husky add` is also dead — create hook files directly (no shebang, no chmod — the shim runs `sh -e`). `.husky/pre-commit` + `.husky/commit-msg` are tracked; `.husky/_/` is untracked and absent in fresh worktrees (hooks silently skipped — false-green on e2e; recreated by `npm run prepare`)

---

Source of truth: `scripts/commit-msg-check.mjs` (ADR-022) — this file is verbatim cheat sheet, do not drift.
Import: `@.agents/plans/commit-convention.md`
