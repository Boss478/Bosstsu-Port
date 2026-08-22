# ADR-013 — Hosting migration: Hostinger KVM1 (expired) → VisperHost Thailand + local-only testing interim

**Date:** 2026-08-03 · **Status:** Accepted (user-declared infra change; project doc updates user-approved 2026-08-03)

## Context
The Hostinger KVM1 VPS (1 vCPU, 4 GB RAM, 50 GB SSD, 4 TB bandwidth, IP 187.77.146.149) has **expired and is decommissioned** — confirmed by observer ticket 2026-08-03 09:20 (+07): SSH/HTTP unreachable, `srv1676702.hstgr.cloud` has no A record. All production references to it are now historical.

Planned replacement: **VisperHost Thailand — 2 vCPU, 4 GB RAM, 60 GB SSD, ~50% cheaper** than the Hostinger plan, **Bangkok/TH datacenter** (good latency for Thai classroom users). **Not yet purchased — procurement in progress.** Until provisioned, **no VPS exists → all testing/verification runs locally.**

## Decision 1 — Migrate to VisperHost Thailand (2 vCPU / 4 GB / 60 GB SSD)
- **CPU 1→2 vCPU**: doubles headroom for SSE fan-out (Class Tools), analytics writes, dictionary audio proxy, and build/start steps. This is relief, not a license to grow feature load.
- **RAM unchanged 4 GB → DB pool stays capped at 3. Do NOT raise.** Pool is memory-bound, not CPU-bound; 4 GB RAM is the same budget.
- **Rate limits unchanged**: 5 logins / 15 min, analytics 120/min.
- **Concurrency target unchanged**: 50–100 users; 2 vCPU makes the envelope more comfortable but the target stays.
- **SSD 50→60 GB**: +10 GB headroom for uploads/logs/backups — no design change.
- **Bandwidth**: old plan had 4 TB; VisperHost plan bandwidth **TBD — verify before first deploy** that it covers 50–100 concurrent users + media uploads.

## Decision 2 — Interim operating mode: local-only testing (no VPS)
- Until VisperHost is provisioned: **no production deployment**. Full verification locally:
  - `npm run build`, `npm run lint`, `npm run typecheck`, vitest suite, eval harness
  - k6 load smoke against local prod build (:3301, per `.agents/report/k6-baseline-2026-08-02.md` pattern)
- Release gate: code ships only when build/lint/tests pass locally; **deploy step deferred** until VPS ready (flag in changelog).
- Docker dev environment (`docker compose --profile dev`) remains the local MongoDB + hot-reload path; `npm run dev` (:3300) unchanged.

## Decision 3 — VisperHost deployment playbook (when provisioned)
Reuse the existing stack unchanged: multi-stage Dockerfile, docker-compose (app 1024M / mongo 1536M / mongo-express 128M RAM limits), Caddy reverse proxy + auto-TLS, entrypoint upload-dir creation, `scripts/backup.sh`.
- New VPS IP unknown → update `.agents/reference/deployment.md`, `.ssh/config`, observer probes when known.
- Post-deploy: run standard k6 load smoke + observer uptime monitoring immediately (new provider, unproven reliability).

## Consequences
- Released site + admin are **down until the new VPS is provisioned** (personal portfolio — impact low/medium; user is aware and driving the purchase).
- Docs referencing KVM1/1-vCPU are now stale → update list tracked in `.agents/tasks/todo.md` (AGENTS.md Resource line, deployment.md, subagent-orchestration.md, requirements.md, memory.md, changelog is historical — leave).
- Cold-start E2E timing guidance ("single-core VPS needs 30s+ timeouts") becomes moot for prod but stays valid for constrained local runs.

## Constraints honored
Pool 3 unchanged · rate limits unchanged · no schema/DB changes · no new infra (reuses existing compose stack).
