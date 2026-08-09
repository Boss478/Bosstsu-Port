# Env Upgrade T9a — Production-Server Smoke (SSE / Upload / next/image / agentRules)

**Date**: 2026-08-08 | **Branch**: `env-nextjs-16.3.0` | **Node**: `v24.19.0` (prepended `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"` to every shell) | **Status**: ✅ ALL CHECKS PASSED — no stop conditions triggered, no `src/` changes, no commits

**Target**: already-running prod server on `:3301` (Node 24, T8 prod build, `next start`). Never stopped/started it; no `next dev` run. Logs: `/tmp/env-upgrade-prod-server.log`.

---

## Task 1 — Sanctioned config change (user decision)

`next.config.ts` — added `agentRules: false` top-level, next to `poweredByHeader: false` (prevents Next 16.3 `next dev` auto-upsert of AGENTS.md/CLAUDE.md blocks).

```
$ grep -n "agentRules" next.config.ts
10:  agentRules: false, // Prevent next dev 16.3 auto-upsert of AGENTS.md/CLAUDE.md blocks (user decision 2026-08-08)
```

`git diff next.config.ts` shows exactly this one line added — nothing else. (Project gotcha honored: grep-verified immediately after edit.)

## Task 2 — SSE smoke via curl/node against :3301 ✅ (the 16.3 native-streams gate)

**Session**: `6a6f686f4e0e9f304ad1a7bb` (sessionCode `K6LOAD`, type `poll`, `isActive: true`, `currentStep: -1`) — verified live via mongoose read-only query (no mongosh installed on this host). Collection `toolsessions`, DB `boss478`.

**2a. Initial step + heartbeat transcript** (node fetch stream, timestamped):

```
[+439ms] HTTP 200 | content-type: text/event-stream
[+444ms] EVENT #1 -> step  {"type":"step","currentStep":-1,"kicked":false,"kickedTokens":[]}
[+30429ms] EVENT #2 -> heartbeat  {}
```

- First `step` event at **+444ms** — well under the 2s requirement ⇒ **no compression buffering** (`compress: true` in next.config, Next flushes correctly).
- Heartbeat at **+30.4s** — matches `HEARTBEAT_INTERVAL_MS = 30s` cadence ⇒ within the ≤35s requirement.
- Content-type `text/event-stream`, HTTP 200.

**2b. Error paths**:
- Missing sessionId → **HTTP 400** `Missing sessionId` ✓
- Nonexistent session (valid ObjectId format) → **HTTP 404** `Session not found` ✓

**2c. Disconnect + reconnect**: curl connected, received step event, killed at 3s; immediate reconnect → HTTP 200 + step event in +37ms ✓

**2d. 9-connect leak loop** (`MAX_CLIENTS_PER_IP = 8`, all connections same "IP" — default curl UA → same `unknown-<hash>` key since no X-Forwarded-For):

```
conn #1: HTTP 200 … conn #8: HTTP 200, conn #9: HTTP 200   ← 9th NOT 429 ✓
fresh conn after loop: HTTP 200
```

⇒ **no leaked clients** — disconnect cleanup (`req.signal` abort → `safeClose` → `removeClient` → ipCounts decrement) works on 16.3 native streams.

**2e. Cap sensitivity proof (cap is real, test not vacuous)**: 9 *concurrent* connections from same IP → 8 admitted (200), 1 rejected. The rejected one surfaced as curl `000` (stream errored via `addClientInternal`'s `controller.error('Too many connections from this IP')` race path — logged in prod log) rather than a route-level 429 (route pre-check raced with the 8th admit). Both layers enforce the same cap; 429 and stream-error are the two pre-existing rejection surfaces. Post-burst fresh connection: 200 (no residual state).

## Task 3 — Upload pipeline ✅ (webp + jpeg paths)

**Auth**: `POST /api/upload` requires cookie `admin-token` = `timestamp.HMAC-SHA256(ADMIN_TOKEN_SECRET, timestamp)` (minted only by the `loginAdmin` server action at `src/app/admin/login/actions.ts`). Per task instruction I did the **ONE** documented server-action login POST (multipart `$ACTION_REF_1`/`$ACTION_1:0`/`$ACTION_1:1`/`$ACTION_KEY` protocol, action id `60cab910cdb6a646eed579f2022a0fbfbfbf9da6b2` from the login page flight payload): → **HTTP 303** (success redirect), cookie captured in jar. Correct password ⇒ `resetAttempts(ip)` on success ⇒ **login limiter untouched (0 failed attempts consumed; 1 success)**. Upload requests themselves never touch the login limiter (`verifyAuth` is cookie-only).

Test image: 64×64 synthetic gradient PNG (9434 B) generated with sharp 0.35.3 in `/tmp/t9a-test.png`.

| Folder | shouldConvert | Result | Disk proof |
|---|---|---|---|
| `misc` (jpeg path) | false | 200 → `/uploads/misc/2026/08/515f02ce-a29d-4f78-b4f6-b0203cd09852.jpg` | `file`: *JPEG image data, Exif standard… progressive, precision 8, 64x64* ✓ |
| `portfolio` (webp path) | true | 200 → `/uploads/portfolio/2026/08/a3fca73d-ca97-4947-83b4-6ef305a8deb7.webp` | `file`: *RIFF (little-endian) data, Web/P image* ✓ |

Both files verified on disk under `public/uploads/<folder>/2026/08/`. **Left in place per instructions** (no deletion without asking — manager: decide cleanup of these 2 test files).

## Task 4 — next/image AVIF check ✅

URL from public page `/` (icon): `http://localhost:3301/_next/image?url=%2Ficon%2Ficon.png&w=256&q=75`

| Accept header | HTTP | content-type | bytes | file magic |
|---|---|---|---|---|
| `image/avif,image/webp,*/*` | 200 | **image/avif** | 4868 | *ISO Media, AVIF Image* ✓ |
| `image/webp,*/*` | 200 | image/webp | 7838 | *RIFF Web/P image* ✓ |
| `*/*` | 200 | image/png | 7193 | *PNG 256x256* (original) ✓ |

`vary: Accept` present on all responses ✓. **Extra validation beyond the task bar**: the AVIF bytes decode via sharp 0.35.3 → `format=heif` (AVIF reports as heif), 256×256 RGBA, real pixel stats (means 108/67/73/154 — gradient intact) — i.e. a genuine encodable AVIF, not a mislabeled header.

## Anomalies observed (benign, none blocking)

1. Prod log shows `⚠ "next start" does not work with "output: standalone" configuration` — pre-existing manager-run setup, `next start` still serves fine (all smoke 200s).
2. Prod log `⨯ Error: failed to pipe response … Too many connections from this IP` — expected: generated by my own 9-concurrent cap test (2e), logged server-side when the 9th concurrent client is rejected. It is the cap working, not a failure.
3. `curl -N` leak-loop/`file`/inline-shell commands got mangled by the snip hook twice (URLs containing `&`, inline `for` loops); worked around with script files + node fetch. No impact on results.
4. `mongosh`/`mongo` CLI not installed on this host — used read-only mongoose query instead (no DB mutations).

## Behavior Contract (still holds)

- SSE: step event ≤2s, heartbeat ≤35s, disconnect→reconnect OK, sequential 9th conn not 429, 400/404 paths sane.
- Per-IP cap (8) still enforced (concurrent proof); no leaked clients after disconnect.
- Upload: webp + jpeg sharp pipelines produce valid files in `/uploads/`; auth cookie path works over plain http.
- next/image: AVIF/WebP negotiation + sharp 0.35 AVIF encode/decode correct; `vary: Accept` set.
- `agentRules: false` in place for any future `next dev`; **no AGENTS.md/CLAUDE.md changes** (`git status` clean of them).
- No `src/` changes, no DB writes (uploads are filesystem-only), no commits.

## Tree state

`M .nvmrc, M next.config.ts (this task), M package-lock.json, M package.json, M src/lib/admin-crud.ts` — only the sanctioned config change added by T9a.

## For Senior Review / Manager

- **2e observation**: under a simultaneous same-IP burst the 9th rejection surfaces as a stream error (`000`, server-side `controller.error`) instead of a clean 429, because the route-level pre-check and `addClientInternal` both guard the same cap and race. Sequential/most-concurrent traffic gets a proper 429. Purely informational — fix would be a `src/` change (out of scope).
- Upload test files (2) left in `public/uploads/` — cleanup decision needed (per global rules I did not delete).
- 1 login consumed from the 5-logins/15min window; limiter otherwise pristine.
- `next dev` (T9 item 7/8 browser flows) NOT run by T9a by design — still owed by whoever executes the dev-server portion of T9.
