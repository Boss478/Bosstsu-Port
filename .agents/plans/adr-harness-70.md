# ADR — Harness 70/70 (D1 / D2 / D6)

**Date:** 2026-08-20 · **Status:** Accepted (REVISED plan `spec-infra-harness-70-plan.md` + senior REVISE + scrutiny 10 loops)
**Plan:** `.agents/plans/spec-infra-harness-70-plan.md` REVISED · **Specs:** `.agents/specs/harness-70.md` (APPROVED) + `.agents/specs/spec-infra.md` (APPROVED)
**Scope:** `opencode.json` MCP + `external_directory` scoping + harness hardening + gitignore trackability. Zero runtime cost.

## Context

Harness baseline 2026-08-20: `node scripts/harness-audit.js repo --format text` = **66/70** (Tool 8/10 `tool_mcp_configured` fail, Sec 8/10 `sec_external_dir` fail). Root cause: `opencode.json` (21L) had no `mcp.servers` and no `external_directory` permissions; harness checks used fragile `content.includes('"mcp"')` / `content.includes('external_directory')` (scrutiny **Loop 4** false positive via comment). `.gitignore:61` `opencode.json` and `.gitignore:84` `.agents/*` blocked tracking of `opencode.json`, `.agents/specs/*.md`, `adr-*.md`, `scripts/harness-audit.js` (scrutiny **Loop 2**). Global source `~/.config/opencode/opencode.json` holds 6 MCP servers (obsidian local `uvx --with fastmcp==2.13.3`, context7 remote, gh_grep remote, chrome-devtools local, playwright local, sequential-thinking local) and ~18 scoped `external_directory` entries — verified as runtime truth. Spec-infra skeleton (README/TEMPLATE) added in P2, but harness 70/70 blocked until `opencode.json` mirror + hardened checks.

Scrutiny history: **Loop 4** hardened `tool_mcp_configured` to `JSON.parse` + `mcp.servers` length + global fallback; **Loop 5** drove `~/obsidian-vault/* allow` (obsidian-mcp `OBSIDIAN_VAULT_PATH`); **Loop 2** added `.gitignore` `!` negations + `git add -f` fallback; **Loop 10** (D4 weight 1) locked maxScore 70 preservation — companion ADR `adr-spec-infra.md` (D3/D4/D5/D6) keeps 70/70 stable, this ADR covers D1/D2/D6.

This ADR records **D1 C mirror+fallback**, **D2 C vault allow (5 entries)**, **D6 gitignore negations + `add -f` fallback** with pros/cons and rejected alternatives, per plan REVISED §3 + §10 Decision Record and implementation plan `implementation-plan-spec-infra-harness.md` Task 6.

## Decisions

### Overview

| Decision | Title | Choice |
|----------|-------|--------|
| D1 | MCP mirror + fallback to global | **C: repo mirror 6 servers + `JSON.parse` + fallback `~/.config/opencode/opencode.json`** |
| D2 | external_directory scoping | **C: 5 entries `./*` `/tmp/*` `~/obsidian-vault/*` allow + `../*` `~/*` ask** |
| D6 | Gitignore trackability | **`!` negations + `git add -f` fallback** |

### D1 — MCP mirror+fallback (`JSON.parse`, global path) — Loop 4 rationale

**Choice (D1 C):** Repo `opencode.json` **mirrors global 6 servers** (`jq -e '.mcp.servers | length==6'`) for clean-checkout 70/70; harness hardens to **structured `JSON.parse`** (`parsed.mcp.servers` length >=1) plus **fallback global path `~/.config/opencode/opencode.json`** check. Keys sorted `$schema`→`mcp`→`permissions`→`commands`.

Harness change (`scripts/harness-audit.js` `tool_mcp_configured`):

```js
let hasMCP = false
try { const j = JSON.parse(content); hasMCP = !!(j.mcp && j.mcp.servers && Object.keys(j.mcp.servers).length >= 1) } catch {}
if (!hasMCP) {
  try { const g = fs.readFileSync(path.join(home, '.config', 'opencode', 'opencode.json'), 'utf-8'); const gj = JSON.parse(g); hasMCP = !!(gj.mcp && gj.mcp.servers && Object.keys(gj.mcp.servers).length >=1) } catch {}
}
```

**Loop 4 rationale:** Scrutiny Loop 4 showed `content.includes('"mcp"')` passes on a comment `// "mcp" comment` with no `mcp` key — false green. `JSON.parse` + `Object.keys(...).length` is deterministic; `try/catch` avoids crash on invalid JSON. Global path `~/.config/opencode/opencode.json` is runtime truth — fallback prevents false red if mirror drifts (accepted drift).

**Why 6 servers mirror global:** Global `~/.config/opencode/opencode.json#mcp.servers` = `obsidian` (local uvx `OBSIDIAN_VAULT_PATH=/Users/boss123/obsidian-vault`), `context7` (remote `https://mcp.context7.com/mcp`), `gh_grep` (remote `https://mcp.grep.app`), `chrome-devtools` (local `npx -y chrome-devtools-mcp@latest`), `playwright` (local `npx -y @playwright/mcp@latest`), `sequential-thinking` (local `npx -y @modelcontextprotocol/server-sequential-thinking`). Repo mirrors exactly for `jq` length 6 and harness count.

| Pros | Cons |
|------|------|
| Clean-checkout self-contained — 70/70 without global dependency | Mirror can drift from global (accepted, fallback covers) |
| `JSON.parse` avoids comment false positive (Loop 4) | `try/catch` adds 3 lines vs `includes` one-liner |
| Global fallback `~/.config/opencode/opencode.json` adds resilience | Requires `os.homedir()` + `fs.readFileSync` for fallback path |
| Deterministic: `Object.keys(...).length >=1` — no string ambiguity | — |

**Rejected:** strict mirror-only (Option A) — fragile on drift, harness would red until repo manually re-mirrored; string `includes` only (original) — false green on comment, no structure.

**Verify D1:** `jq -e '.mcp.servers | length==6' opencode.json`; `node scripts/harness-audit.js repo --format json | jq '.failed_checks[] | select(.check=="tool_mcp_configured")'` empty after fix; temp file with `// "mcp" comment` but no key → harness correctly **fails** (not false positive).

### D2 — external_directory 5 entries incl. vault allow — Loop 5 rationale

**Choice (D2 C):** `permissions` array 5 `external_directory` entries: `./*` `allow` + `/tmp/*` `allow` + `~/obsidian-vault/*` `allow` + `../*` `ask` + `~/*` `ask`. Least-privilege, `allow` only for project, tmp, and vault.

```json
{ "action": "external_directory", "resource": "./*", "effect": "allow" },
{ "action": "external_directory", "resource": "/tmp/*", "effect": "allow" },
{ "action": "external_directory", "resource": "~/obsidian-vault/*", "effect": "allow" },
{ "action": "external_directory", "resource": "../*", "effect": "ask" },
{ "action": "external_directory", "resource": "~/*", "effect": "ask" }
```

**Loop 5 rationale:** Obsidian MCP requires `OBSIDIAN_VAULT_PATH` (`~/obsidian-vault`) — global permissions already allow it via ~18 entries. Minimal 4-entry variant (`./*` `/tmp/*` `../*` `~/*`) makes every `read_note_tool` / `write` to vault hit `ask` — breaks hot path (researcher, brain-caller, memory capture). Adding `~/obsidian-vault/* allow` restores `allow` for vault only, keeps parent/home as `ask`.

Harness hardened similarly (`sec_external_dir`):

```js
try { const parsed = JSON.parse(content); const perms = parsed?.permissions; limited = Array.isArray(perms) && perms.some(p => p && p.action === 'external_directory'); } catch {}
```

`permissions.some(p=>action==="external_directory")` — structured, not `includes`.

| Pros | Cons |
|------|------|
| `~/obsidian-vault/* allow` fixes obsidian-mcp hot path (Loop 5) | 1 extra permission line vs minimal 4 |
| Least-privilege: `./*` allow, parent/home `ask` — never `* allow` | Requires precise `resource` strings (`~/` vs `~/obsidian-vault/`) |
| `JSON.parse` + `.some` avoids string false positive | — |
| Mirrors global least-privilege pattern | — |

**Rejected:** 4-entry minimal (Option A) — breaks vault `allow`, every obsidian call `ask`; 12+ mirror of global (Option B) — too permissive, copies `allow` for all home, not least-privilege; `* allow` — high risk.

**Verify D2:** `jq -e '[.permissions[] | select(.action=="external_directory")] | length>=5' opencode.json`; `jq -e '[.permissions[] | select(.resource=="~/obsidian-vault/*" and .effect=="allow")] | length==1' opencode.json`; `node scripts/harness-audit.js repo --format text` shows `sec_external_dir` pass.

### D6 — Gitignore negations + `git add -f` fallback — Loop 2 rationale

**Choice (D6):** Add `!` negations after `.gitignore:84` + keep `git add -f` fallback for verification:

```gitignore
!opencode.json              # after opencode.json line :61
!.agents/specs/             # after !.agents/report/archive/
!.agents/specs/*.md
!.agents/plans/             # un-ignore plans dir itself
!.agents/plans/adr-*.md
!scripts/harness-audit.js
```

Base chain already: `.agents/` → `!.agents/` → `.agents/*` → `!.agents/memory/` etc. Fallback `git add -f` covers fresh clones where negations not yet committed.

**Why:** `.agents/*` + `opencode.json` ignored by default. Without negations, specs/ADRs/opencode/harness require `git add -f` every time → `git status` noisy (`!! ignored`), easy to miss. Negations make `git status` clean (`??` → `A` after `git add`), while `add -f` remains safety net during P0 transition.

**Loop 2 rationale:** Early plan used `add -f` only (Loop 2). Scrutiny Loop 2 added negations as primary + `add -f` fallback (REVISED §4 Phase 0 + §10 Decision Record: "rejected add -f only (status noisy)"). Both documented — negation first, fallback second.

**Loop 10 context:** Companion D4 (weight 1 advisory, repo-only, max 70) ensures harness max stays 70 after specs infra — D6 tracking enables `ctx_specs_dir` weight 1 later without breaking `70/70` CI string. See `adr-spec-infra.md` D4.

| Pros | Cons |
|------|------|
| `git status` clean — specs visible as untracked, not `!! ignored` | More `.gitignore` lines (4 negations + `!.agents/plans/`) |
| `git check-ignore -v .agents/plans/adr-*.md` shows `!` negation (trackable) / plain `git check-ignore` empty (not ignored) | Requires parent `!.agents/` + `!.agents/plans/` chain — ordering matters |
| `git add` works without `-f` after merge | Transition still needs `-f` until negations land |
| Rejected `docs/specs/` (not agent-native) — `.agents/specs/` consistent with agent memory/plans | — |

**Rejected:** `docs/specs/` — not agent-native, build-visible; `add -f` only — noisy status, error-prone (Loop 2).

**Verify D6:** `git check-ignore .agents/plans/adr-harness-70.md` → exit 1, no output (not ignored); `git check-ignore -v .agents/plans/adr-harness-70.md` → `!.agents/plans/adr-*.md` (negation covers `adr-*.md`); `git ls-files --error-unmatch .agents/plans/adr-harness-70.md` passes after `git add` (or `git add -f` during transition); same for `opencode.json` / `.agents/specs/*.md` / `scripts/harness-audit.js`.

## Alternatives Considered (summary)

| Decision | Rejected | Reason |
|----------|----------|--------|
| D1 | strict mirror-only (no fallback) | Fragile on drift (Loop 4) |
| D1 | `content.includes('"mcp"')` | Comment false positive |
| D2 | 4-entry minimal (no vault) | Breaks obsidian-mcp hot path (Loop 5) |
| D2 | mirror global 12+ entries | Too permissive, not least-privilege |
| D2 | `* allow` | High risk |
| D6 | `docs/specs/` | Not agent-native |
| D6 | `add -f` only | Status noisy (Loop 2) |

## Consequences

- `opencode.json` self-contained 6+5, valid JSON (`jq empty` pass, `$schema` unchanged), clean-checkout 70/70; fallback `~/.config/opencode/opencode.json` covers drift.
- Harness `tool_mcp_configured` + `sec_external_dir` hardened to `JSON.parse` + length/some — no crash on invalid JSON, no false green.
- Vault `~/obsidian-vault/* allow` restores obsidian MCP `allow`; `../*` + `~/*` remain `ask` — least-privilege 5.
- Git tracking clean: `git status` shows specs/ADRs/opencode without `!!`; `git ls-files --error-unmatch` passes for all.
- No runtime cost: docs + config, 0 DB queries, pool 3 unchanged, `node harness` <100ms, Read 0.1ms.
- Companion `adr-spec-infra.md` D3/D4/D5/D6 + this ADR D1/D2/D6 = full D1-D6 coverage; Loop 2/4/5/10 rationale preserved.
- File-disjoint from T5 `opencode.json` (this ADR is `.agents/plans/*.md`, no overlap).

## Verification

```bash
# D1 D2 D6 grep (>=3)
grep -c "D1\|D2\|D6" .agents/plans/adr-harness-70.md  # >=3

# D1
jq empty opencode.json
jq -e '.mcp.servers | length==6' opencode.json
jq -e '.mcp.servers | has("obsidian") and has("context7") and has("gh_grep") and has("chrome-devtools") and has("playwright") and has("sequential-thinking")' opencode.json

# D2
jq -e '[.permissions[] | select(.action=="external_directory")] | length>=5' opencode.json
jq -e '[.permissions[] | select(.resource=="~/obsidian-vault/*" and .effect=="allow")] | length==1' opencode.json

# D6 gitignore + trackability
git check-ignore .agents/plans/adr-harness-70.md          # exit 1, no output (not ignored)
git check-ignore -v .agents/plans/adr-harness-70.md        # shows !.agents/plans/adr-*.md (negation covers adr-*.md)
git check-ignore opencode.json                              # exit 1 (not ignored)
git ls-files --error-unmatch .agents/plans/adr-harness-70.md  # after git add / add -f
git ls-files --error-unmatch opencode.json
git ls-files --error-unmatch scripts/harness-audit.js

# Harness
node scripts/harness-audit.js repo --format text          # 70/70, Failed Checks empty
node scripts/harness-audit.js repo --format json | jq '.overall_score, .max_score, .failed_checks'

# This ADR
ls -lh .agents/plans/adr-harness-70.md
```

Fallback if negations not yet committed: `git add -f .agents/plans/adr-harness-70.md` then `git ls-files --error-unmatch`.

## Related

- Specs: `.agents/specs/harness-70.md` §5 + §8 Success Criteria — D1/D2/D6 listed; `.agents/specs/spec-infra.md` §8 — D3/D4/D5/D6
- Plan REVISED: `.agents/plans/spec-infra-harness-70-plan.md` §3 D1/D2/D6 + §4 Phase 3 + §10 Decision Record (D1 C mirror+fallback, D2 C vault allow, D6 negation+add-f) + SDO §10 (Persist to `adr-harness-70.md`)
- Implementation Plan: `.agents/plans/implementation-plan-spec-infra-harness.md` Task 6 (this file) + Task 5 `opencode.json` 70/70 verified
- ADRs: `adr-spec-infra.md` (D3/D4/D5/D6) — companion; `adr-013-hosting-migration-visperhost.md` (no VPS, local-only)
- Loops: **Loop 2** (D6 negations + add-f) · **Loop 4** (D1 `JSON.parse` vs includes, global `~/.config/opencode/opencode.json` fallback) · **Loop 5** (D2 vault allow) · **Loop 10** (D4 max 70, companion)
- Harness: `scripts/harness-audit.js` `tool_mcp_configured` (D1 JSON.parse + fallback) + `sec_external_dir` (D2 JSON.parse + some)
- Global config: `~/.config/opencode/opencode.json` — 6 servers runtime truth, `OBSIDIAN_VAULT_PATH=/Users/boss123/obsidian-vault`

## Resource Cost

+1 markdown ~8KB, 0 deps, 0 DB, Read 0.1ms, `node harness` <100ms, `npm run build` unchanged (md ignored via `.agents/**`).

---
*ADR maintained by senior-engineer. Human approves transitions. Last sync: 2026-08-20.*
