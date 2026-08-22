# Rule: Deployment

Source: @ AGENTS.md Project Overview + Known Gotchas + memory

## Deployment

- VisperHost Bangkok 2 vCPU 4GB 60GB SSD — **NO VPS now, procurement in progress** (ADR-013).
- Hostinger KVM1 1vCPU 4GB EXPIRED 2026-08 — no longer used.
- Resource: pool 3 do not raise (RAM budget), 5 logins/15min, concurrency 50-100.
- Test locally only until provisioned; no prod deploy without user ask (devops-only).
- Docker dev `.next` is named volume — recreate with `-V` (`--force-recreate -V`), else stale deps.
- Don't run `npm run build` while dev server live (shared `.next` hazard).
- Node 24 LTS — `engines` >=24.15.0, `.nvmrc` 24, runtime `/opt/homebrew/opt/node@24/bin`.
- Observability: show evidence, keep pool 3 / rate limit / concurrency verified not changed.
