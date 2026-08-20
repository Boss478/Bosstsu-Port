# Caveman (JuliusBrussee/caveman) — Compatibility & Application Report

**Date:** 2026-08-13 · **Author:** Manager · **Status:** Research complete, NOT installed (user chose research-first)

---

## 1. What it is

**Repo:** https://github.com/juliusBrussee/caveman — 97.9k★ / 285 commits / actively maintained (last benchmark 2026-08-10, v1.10.0 pinned installer).

Token-compression layer for coding agents, two halves:

| Half | License | Function |
|---|---|---|
| **The skill** | MIT | Output compression — agent replies in terse caveman-speak; code/commands/errors byte-exact. Ships `/caveman [lite\|full\|ultra\|off]`, `/caveman-commit`, `/caveman-review`, `/caveman-compress`, `/caveman-stats`, 3 cavecrew subagent presets. |
| **Proxy/Engine** | BSL-1.1 | Local Go proxy compressing **input** tokens (33.2% fewer provider input tokens, pinned 54-run benchmark; honest numbers: skill adds ~1–1.5k input tokens/turn). Wraps 7 agents natively incl. opencode. |

## 2. Compatibility verdict: ✅ COMPATIBLE (verified against installed binaries)

| Check | Result | Evidence |
|---|---|---|
| opencode supported target | ✅ first-class | `PROVIDERS` matrix: `mech: 'native opencode plugin'`, detect `command:opencode` |
| opencode version | ✅ v1.18.16 ≥ 1.15 min | plugin comment: "Hook mapping (opencode >= 1.15.x)" |
| `event` dispatcher + `session.created` event type | ✅ | verified in `@opencode-ai/sdk/dist/gen/types.gen.d.ts:494` (installed pkg) |
| `chat.message` hook | ✅ | `@opencode-ai/plugin/dist/index.d.ts:155` (installed pkg) |
| `experimental.chat.system.transform` hook | ✅ | `@opencode-ai/plugin/dist/index.d.ts:233` (installed pkg) |
| Node ≥ 18 | ✅ v26.7.0 | installer `checkNodeVersion()` |
| macOS / platform | ✅ darwin | installer supports macOS/Linux/Windows |
| Hook collision with existing plugins | ✅ none | our compactor/injection-guard use `tool.execute.after`; caveman uses `event`/`chat.message`/`experimental.chat.system.transform` — disjoint |
| Installer integrity | ✅ | pinned immutable tag v1.10.0, SHA-256 manifest, ownership journal, `.bak` backups, clean `--uninstall` |

> **Correction found:** README/INSTALL.md describe opencode hooks as `session.created` + `tui.prompt.append` — **outdated**. Actual plugin code (src/plugins/opencode/plugin.js) uses the `event` dispatcher + `chat.message` + `experimental.chat.system.transform` (issues #418/#421 fixed this). We verified against the *code and installed types*, not the marketing text.

## 3. What the opencode install touches (all GLOBAL — project files untouched)

Requires a **local clone** (`node bin/install.js --only opencode`; the npx path fails for opencode — installer errors cleanly). Writes to `~/.config/opencode/`:

| Path | What |
|---|---|
| `plugins/caveman/` | plugin.js (Bun ESM) + package.json + caveman-config.cjs + caveman-parse.cjs |
| `opencode.json` | patches `plugin` array with `./plugins/caveman/plugin.js`; **first `.bak` backup made** |
| `AGENTS.md` (global) | appends fenced `<!-- caveman-begin/end -->` Tier-3 ruleset block — removable by uninstall |
| `skills/` | 7 skill dirs: caveman, caveman-commit, caveman-review, caveman-help, caveman-stats, caveman-compress, cavecrew |
| `commands/` | 6 `/caveman*` command files |
| `agents/` | 3 cavecrew subagent presets (`tools:` line stripped for opencode schema, issue #386) |

**Project `AGENTS.md` (Boss478) is safe** — only `--with-init` writes per-repo rule files, and the opencode install path ignores that flag. Rule: **never run `--all` or `--with-init` inside this repo.**

## 4. How it works in our setup (mechanism)

1. `event` (session.created) → writes `.caveman-active` flag in `~/.config/opencode/` (mode from default config; `off` removes it)
2. `chat.message` → parses `/caveman lite|full|ultra|wenyan*|off` + natural language ("stop caveman" / "normal mode")
3. `experimental.chat.system.transform` → pushes `CAVEMAN MODE ACTIVE (<mode>)` into `output.system` string[] **per turn** (unless mode is `off`)
4. Global AGENTS.md ruleset = always-on Tier-3 base (drop articles/filler, fragments OK, technical terms exact, code unchanged; auto-clarity: drops caveman for security warnings / irreversible actions / confused user)

## 5. Risks & mitigations (Boss478-specific)

| # | Risk | Mitigation |
|---|---|---|
| 1 | ~1–1.5k input tokens/turn overhead (their own warning); net-negative possible on terse workloads | Use `lite` level; toggle `off` for planning-heavy sessions; `/caveman-stats` measures actual impact |
| 2 | Caveman-speak could degrade plan briefs / acceptance criteria readability | `Auto-Clarity` rule + `off`; subagent orchestration (AGENTS.md) remains authoritative — skill never overrides project rules |
| 3 | 3 cavecrew agents = roster noise (we have explore/junior-engineer/senior-engineer) | Ignore them; no interference with our orchestration (distinct `cavecrew-*` ids) |
| 4 | `/caveman-commit` may drop `(T#)` ref groups | Project hook accepts ref-less conventional commits (refs optional); agents follow AGENTS.md convention, not the skill, when committing |
| 5 | TH/EN copy quality | Skill governs agent *chat* only — code/commits/PRs stay normal per ruleset "Boundaries" line; copywriter/locale-reviewer flows unaffected |
| 6 | `experimental.*` hook namespace could shift in future opencode releases | Monitor after upgrades; plugin is actively maintained (fixes #418/#421 already landed) |
| 7 | Global AGENTS.md (8.8KB) gets fenced block appended | Fully reversible via `--uninstall`; fence markers keep user content intact |

## 6. How to apply — step-by-step (when approved)

```bash
# 1. Clone pinned tag (NOT main)
git clone --depth 1 --branch v1.10.0 https://github.com/JuliusBrussee/caveman /tmp/caveman

# 2. Dry-run first — prints every write, writes nothing
cd /tmp/caveman && node bin/install.js --only opencode --dry-run

# 3. Install (global opencode config only)
node bin/install.js --only opencode

# 4. Verify
opencode --version        # restart opencode session so plugin loads
# in a session: type /caveman → expect terse reply; "normal mode" to stop

# 5. Uninstall if unwanted
node bin/install.js --uninstall --only opencode
```

**Never:** `--all`, `--with-init`, `--with-mcp-shrink` in this repo (touches project AGENTS.md / adds MCP proxy). Proxy/wrap (BSL) **not recommended now** — compactor plugin already trims tool output; skill-only covers the need with zero extra moving parts.

## 7. Recommendation

**Skill-only, MIT path.** Cost: ~2 min + 1 opencode restart. Reversible. Expected benefit: faster, terser agent replies; measure with `/caveman-stats` before committing to it. Start at `lite`, escalate only if output stays readable. Decision pending user approval — nothing installed.

---

# ADDENDUM (2026-08-13) — opencode v2 re-check: ❌ NOT COMPATIBLE as-is

User's runtime is **opencode v2 preview** (`opencode2` v0.0.0-next-17403, npm `@opencode-ai/cli` `next` channel; stable line = 1.18.18). Re-verified everything against the v2 runtime — **verdict flips to NOT compatible**.

## Evidence chain (source-verified, not inferred)

1. **v2 plugin loader schema** (`anomalyco/opencode` dev → `packages/core/src/config/plugin/external.ts`): accepts ONLY modules whose `default` export is `{ id, effect }` (Effect API) or `{ id, setup }` (Promise API). Caveman's `plugin.js` exports `default = async function` (V1 format) → `Schema.decodeUnknownEffect` fails → wrapped in `Effect.ignoreCause` → **silently dropped, no error, no crash**.
2. **No v1-compat loader anywhere** in v2 plugin code (`packages/core/src/plugin/*`); zero imports of `@opencode-ai/plugin/v1` in the runtime. `@opencode-ai/plugin@next` ships `dist/v1` types for authoring compat only — not runtime loading.
3. **V2 hook surface** (Promise API, `Plugin.define({ id, setup(ctx) })`): `tool.hook("execute.before|after")`, `session.hook("context"|"http.request"|"http.response")` (mutable `system: SystemPart[]` = the v2 replacement for system-transform), `event.subscribe`, domain transforms (agent/catalog/command/skill/…), `shell`, `aisdk`. **No `chat.message`, no `experimental.chat.system.transform` dispatch for v2 plugins** (those strings exist only in the v1 types).
4. **Best local evidence**: the user's own plugins (snip.ts, compactor.ts, injection-guard.ts) were already ported to V2 format — "Plugin.define instead of an async function default export" — because V1 format doesn't load in v2. They run fine in this session.
5. **Config dirs shared**: v2 still reads `~/.config/opencode/` (opencode.json, plugins/, commands/) + new `~/.opencode/` and project `.opencode/`. Installer writes land in the right place — they're just not loadable.

## What would still work after a naive install (partial, confusing)

| Piece | In v2 |
|---|---|
| AGENTS.md fenced ruleset (Tier-3 always-on) | ✅ works — static terse-speak rules |
| 6 `/caveman*` command files | ✅ works (commands dir scanned) |
| 7 skill folders + 3 cavecrew agents | ✅ loads (dirs scanned) |
| `opencode.json` plugin entry | ❌ silent no-op |
| Mode flag on session.created | ❌ no dispatch |
| `/caveman lite\|full\|ultra\|off` + natural-language toggles | ❌ no dispatch |
| Per-turn system reinforcement | ❌ no dispatch |

Result: **always-on caveman rules with no way to toggle off mid-session** — worse than nothing.

## Paths forward

1. **Port the plugin to V2 format** (recommended if Caveman is wanted): ~1–2h task — `Plugin.define({ id: "local.caveman", setup })` with `event.subscribe` (session.created → flag file), message-event subscription for mode parsing, `session.hook("context")` → push reinforcement into `output.system`. Pure JS, zero deps, mirrors the existing plugin.js logic. Would be a normal project task (manager plans, engineer implements).
2. **Skip Caveman** — v2 is preview; plugin ecosystem is mid-migration. Revisit when caveman ships a v2-format opencode plugin or when v2 stable lands.
3. **Run stable v1 for caveman** — not sensible; the whole environment (config, plugins, session) is migrated to v2.

## Bottom line

`install.js --only opencode` on this machine = silent partial install. Do NOT install as-is. If Caveman is wanted on v2: port the plugin (option 1) — everything else (ruleset/commands/skills/agents) installs and works today.
