# Spec: Harness 70/70 — Fix Tool Coverage + Security Guardrails

> Gated workflow: SPECIFY → PLAN → TASKS → IMPLEMENT. Human reviews each gate.
> Audit baseline 2026-08-20: `node scripts/harness-audit.js repo` = 66/70 (Tool 8/10, Sec 8/10). Target 70/70.

## ASSUMPTIONS I'M MAKING — REVISED per senior review 2026-08-20:
1. `scripts/harness-audit.js` (671 lines, restored 2026-08-20 from 5064b2f) IS the harness source — rubric 2026-03-30, but current checks use fragile `includes('"mcp"')` → will harden to `JSON.parse` + `mcp.servers` length.
2. Project harness SHOULD be self-contained (`opencode.json` at root) **BUT** fallback to global `~/.config/opencode/opencode.json` adds resilience — spec chooses **C: mirror + fallback** (mirror 6 servers for clean-checkout, fallback covers drift).
3. Global MCP (6 servers verified in `~/.config/opencode/opencode.json#mcp.servers`) is runtime truth — repo `opencode.json` DOCUMENTS it (mirror, not execution).
4. `external_directory` must include `~/obsidian-vault/* allow` (obsidian MCP `OBSIDIAN_VAULT_PATH`) + minimal `./*` `/tmp/*` allow, `../*` `~/*` ask — least-privilege 5 entries.
5. `opencode.json` and `.agents/specs/*.md` and `scripts/harness-audit.js` are currently **gitignored** (`.gitignore:61` + `:84`) → Plan Phase 0 fixes via `!` negations + `git add -f` fallback.
6. No VPS deploy until VisperHost provisioned (ADR-013) — verification local only.
→ Correct me now or I proceed with these.

## 1. Objective

**What:** Close 2 failed harness checks so `repo` = 70/70, and align `hooks|skills|commands|agents` scopes to 20/20, 20/20, 10/10, 20/20.
**Why:** Harness is the quality gate for spec-driven delivery; 66/70 blocks "green" release confidence and masks real gaps.
**Who:** Maintainer + agents (manager/verify/observer) who rely on audit as CI gate.
**Success looks like:** `npm run harness` (or `node scripts/harness-audit.js --format text`) prints 70/70 on clean checkout; no Failed Checks; CI passes.

Failed checks to fix:
- `[Tool Coverage] MCP servers configured (opencode.json)` — `content.includes('"mcp"')` false
- `[Security Guardrails] External directory access limited (opencode.json)` — `content.includes('external_directory')` false

Current `opencode.json` (21 lines): permissions allow-list for edit/shell + one command `goal`; no `mcp`, no `external_directory`.

## 2. Tech Stack

- Next.js 16 App Router, TS strict, Node 24 (>=24.15.0), `opencode.json` schema `https://opencode.ai/config.json`
- Harness: `scripts/harness-audit.js` (node, no deps), rubric `2026-03-30`, categories `tool|ctx|qg|mem|eval|sec|cost`
- Global MCP source: `~/.config/opencode/opencode.json` → `mcp.servers` (6 servers verified)
- Constraint: DB pool 3, 1 vCPU/4GB (VisperHost 2 vCPU planned), 50–100 concurrency — harness fixes are config-only, zero runtime cost.

## 3. Commands

```
Audit (text):  node scripts/harness-audit.js repo --format text
Audit (json):  node scripts/harness-audit.js repo --format json
Audit hooks:   node scripts/harness-audit.js hooks --format text   # expect 20/20
Audit skills:  node scripts/harness-audit.js skills --format text  # expect 20/20
Audit agents:  node scripts/harness-audit.js agents --format text
Verify:        npm run build && npm run lint && npm run typecheck
Alt verify:    npm run harness  (if script added to package.json)
```

## 4. Project Structure

```
.gitignore                     → ADD negations: !opencode.json + !.agents/specs/*.md + !.agents/plans/adr-*.md + !scripts/harness-audit.js
opencode.json                  → ADD mcp.servers 6 mirror + permissions external_directory 5 entries (./* /tmp/* ~/obsidian-vault/* allow, ../* ~/* ask)
scripts/harness-audit.js       → HARDEN 2 checks to JSON.parse (not includes) + global fallback for mcp
.agents/specs/harness-70.md    → THIS SPEC (living doc)
.agents/plans/adr-harness-70.md → ADR D1+D2+D6
```

Primary changes: `.gitignore` + `opencode.json` + `harness-audit.js` (was single-file, now 3-file due to gitignore blocker).

## 5. Code Style

One real snippet beats three paragraphs — target `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "context7": { "type": "remote", "url": "https://mcp.context7.com/mcp" },
      "gh_grep": { "type": "remote", "url": "https://mcp.grep.app" },
      "obsidian": { "type": "local", "command": ["uvx","--with","fastmcp==2.13.3","obsidian-mcp"], "environment": { "OBSIDIAN_VAULT_PATH": "/Users/boss123/obsidian-vault" } },
      "chrome-devtools": { "type": "local", "command": ["npx","-y","chrome-devtools-mcp@latest"] },
      "playwright": { "type": "local", "command": ["npx","-y","@playwright/mcp@latest"] },
      "sequential-thinking": { "type": "local", "command": ["npx","-y","@modelcontextprotocol/server-sequential-thinking"] }
    }
  },
  "permissions": [
    { "action": "external_directory", "resource": "./*", "effect": "allow" },
    { "action": "external_directory", "resource": "/tmp/*", "effect": "allow" },
    { "action": "external_directory", "resource": "~/obsidian-vault/*", "effect": "allow" },
    { "action": "external_directory", "resource": "../*", "effect": "ask" },
    { "action": "external_directory", "resource": "~/*", "effect": "ask" }
  ]
}
```

Conventions:
- JSON keys sorted: `$schema` → `mcp` → `permissions` → `commands`
- `permissions` array: group by `action` (external_directory first, then edit, shell)
- Comments not allowed in JSON — document in ADR, not file

## 6. Testing Strategy

Framework: harness itself + `npm run build/lint/typecheck` (no unit test for config).

| Level | Where | What | Expect |
|-------|-------|------|--------|
| harness | `node scripts/harness-audit.js repo --format json` | overall_score 70 (or 71 if specs check added), failed_checks [] | 0 fails |
| scopes | hooks/skills/commands/agents text | each scope max achieved | hooks 20/20 etc |
| valid JSON | `jq empty opencode.json && jq -e '.mcp.servers \| length==6'` | 6 servers mirror global | pass |
| perms | `jq -e '[.permissions[] \| select(.action=="external_directory")] \| length>=5'` | 5 external_directory entries | pass |
| verify | `npm run build` | opencode.json schema valid | pass |
| lint | `npm run lint` | eslint ignores still exclude scripts/harness-audit.js (D5) | pass |
| git | `git ls-files --error-unmatch opencode.json` | tracked (not ignored) | pass |
| harden | temp file with `// "mcp"` comment only | harness still fails (not false positive) | fail as expected |

Coverage: N/A — config-only. Harness is the test.

## 7. Boundaries

- **Always do:** Keep `scripts/harness-audit.js` in repo (remove from `eslint.config.mjs` globalIgnores if needed for lint coverage? keep ignore but note); run harness before/after each edit; keep `opencode.json` valid JSON (jq check).
- **Ask first:** Changing harness rubric/weights or check logic (e.g., making `tool_mcp_configured` check global fallback) — that changes the gate, needs senior review; altering global `~/.config/opencode/opencode.json` (out of repo).
- **Never do:** Commit secrets to `opencode.json` (no tokens); edit `~/.config/opencode/opencode.json` permissions to widen `* allow` without ask; remove harness file again.

## 8. Success Criteria — REVISED

- [ ] `node scripts/harness-audit.js repo --format text` → `Harness Audit: 70/70` (was 66/70)
- [ ] `hooks` → 20/20, `skills` → 20/20, `commands` → 10/10, `agents` → 20/20
- [ ] `opencode.json` contains `mcp.servers` 6 entries + `external_directory` 5 entries (`./*` `/tmp/*` `~/obsidian-vault/*` allow + `../*` `~/*` ask)
- [ ] `jq -e '.mcp.servers | length==6' opencode.json` pass
- [ ] `jq -e '[.permissions[] | select(.action=="external_directory")] | length>=5' opencode.json` pass
- [ ] `jq empty opencode.json` pass and `$schema` unchanged
- [ ] `git check-ignore -v opencode.json` → no output (not ignored)
- [ ] `git ls-files --error-unmatch opencode.json` pass (tracked)
- [ ] `git ls-files --error-unmatch scripts/harness-audit.js` pass (tracked)
- [ ] Harness checks hardened: `JSON.parse` not `includes` (comment `"mcp"` no longer passes) + global fallback verified
- [ ] `npm run build` + `npm run lint` + `npm run typecheck` still pass
- [ ] ADR at `.agents/plans/adr-harness-70.md` records D1 C (mirror+fallback) + D2 C (vault allow) + D6 gitignore negations

## 9. Open Questions — RESOLVED per plan REVISED

- [x] Harness fallback: **C mirror + global fallback via JSON.parse** (senior REVISE, plan D1 C)
- [x] external_directory: **5 entries incl. `~/obsidian-vault/* allow`** (D2 C, vault needed for obsidian MCP)
- [ ] Add `npm run harness` script to `package.json`? — optional T8, low priority, ask at Task gate
- [x] Keep `scripts/harness-audit.js` in `eslint.config.mjs` globalIgnores (D5, locked in ADR)

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Invalid JSON breaks opencode | Validate with `jq` + `node -e "JSON.parse(fs.readFileSync('opencode.json'))"` pre-commit |
| Permissions too wide (external_directory `* allow`) | Scope to least-privilege: `./*` allow, parent/home ask, `/tmp` allow only |
| Harness check still fails (string match vs object) | Ensure literal `"mcp"` key at top level, not nested string |

## 11. Next Phase: Plan

After spec approval → Plan with 2 options table (mirror vs patch-harness), ordered tasks (1 file, <5 tasks), estimates, dependencies. Then Tasks → Implement.
