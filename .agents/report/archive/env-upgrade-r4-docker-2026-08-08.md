# R4 — Docker Dev Rebuild: app-dev → Node 24 + Next 16.3.0

**Date**: 2026-08-08 | **Agent**: devops | **Branch**: `env-nextjs-16.3.0` (no new commits needed)

## Result

`boss478-app-dev` Docker dev path now serves the upgraded stack correctly:

| Check | Before | After |
|---|---|---|
| Container node | v20.20.2 | **v24.19.0** |
| `npm ls next` (in container) | next@16.2.9 **invalid** (`^16.3.0` required) | **next@16.3.0**, clean |
| `curl http://localhost:3300` | stale/incorrect tree | **HTTP 200**, 64,794 bytes real app HTML (`<html lang="th">`) |
| Image | old (`boss478-app-dev`, node 20) | **`boss478-app-dev:latest` sha256:5d586b812ed5** (1.86GB, built 2026-08-08 14:04Z) |

## What was rebuilt

1. **Dockerfile change** — `dockerfile.dev`: `FROM node:20-alpine` → `FROM node:24-alpine` (1 line).
   - **Commit**: the change landed as `d1408c6` *"infra: app-dev Docker image → node 24 (env upgrade v1.12.0)"* — committed by the parallel env-upgrade agent during this session (around the two server restarts), same content as my edit. Working tree == HEAD; no duplicate commit created. My own commit attempt was blocked by lint-staged (no staged files matching its globs) and became moot.
   - Prod `dockerfile` (3-stage) was already bumped by the env upgrade (`d1408c6` predecessor); `dockerfile.dev` was the missed piece — now fixed.
2. **Image build** — `docker compose build app-dev` (npm ci + sharp rebuild in Alpine; ~105s).
3. **Container recreate** — `docker compose --profile dev up -d --force-recreate -V app-dev`.
   - **Key gotcha**: compose mounts anonymous volumes at `/app/node_modules` + `/app/.next`; they **persist across plain recreates**, shadowing the fresh image (initial recreate still served next@16.2.9 from the old anonymous volume). `-V` (renew-anon-volumes) is REQUIRED after an app-dev image rebuild; it also auto-removed the stale volumes (13 → 7 volumes, 3.985GB → 1.981GB).

## Mongo crash-loop incident (unrelated to config, infra-level)

- While recreating app-dev, mongo began crash-looping (131 restarts, exit 133): fassert abort in FTDC → unclean shutdown → WiredTiger recovery fatal assertion in `initandlisten`.
- **Root cause**: Docker VM disk (16G raw, fully allocated) was ~98% full — my image build re-consumed the 2.9GB freed by the morning's `docker builder prune`. FTDC/WT recovery couldn't write.
- **Fix**: `docker builder prune -af` freed 5.097GB → VM at ~54% (8.6GB/16G, ~7.4GB free). Mongo recovered on next restart; **no data loss** (`mongo_data` named volume untouched; WT recovered from last checkpoint). Container was recreated (restarts=0, healthy).
- mongo/mongo-express config never touched; mongo data verified healthy.

## Port 3300

- Host port 3300: owned by Docker Desktop backend (`com.docker.backend` PID 99642, `TCP *:3300 LISTEN`) → forwards to `boss478-app-dev-1` (`3300/tcp -> 0.0.0.0:3300`).
- No host conflict: local Node 24 keg dev server not running during verification (Chrome had only CLOSE_WAIT sockets from before).
- `app-dev` and `app` both map 3300; cannot run simultaneously (documented compose constraint).

## Disk state (after cleanup)

`docker system df`: Images 5.379GB (0% reclaim) + Containers 164KB + Volumes 1.981GB (0% reclaim) + Build cache 1.22GB → **~8.6GB of 16G VM disk (~54%)**. Stale app-dev anonymous volumes already gone via `-V`.

## Files changed

- `dockerfile.dev` — committed as `d1408c6` on `env-nextjs-16.3.0` (no new commit from this agent).
- No application source changes. Working-tree modifications to 5 session-tool components are a parallel agent's in-progress work — untouched.

## Notes / gotchas

- Snip proxy truncates long `docker logs` lines (~200 chars) — analysis of crash logs must read the VM's json-file log directly (`docker run -v /var/lib/docker/containers/<id>:/m:ro alpine cp ...`), not `docker logs`.
- After ANY `docker compose build app-dev`, recreate with `-V` or the container keeps serving stale node_modules/.next.
- Monitor VM disk after image builds: the 16G Docker.raw fills fast (build cache + image layers). Prune after large builds.
