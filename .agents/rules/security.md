# Rule: Security

Source: @ AGENTS.md Project Overview + Completion Protocol + .agents/settings.json deny list

## Resource & Security

VPS VisperHost planned (2 vCPU, 4GB, 60GB SSD, Bangkok) — **NO VPS now, procurement in progress** (ADR-013). Until provisioned test locally only, no prod deploy.
Resource: DB pool 3 (do not raise — RAM budget), rate limit 5 logins/15min, concurrency 50-100. Hostinger KVM1 1vCPU 4GB EXPIRED 2026-08 — no longer used.
Hostinger expired — no deploy until VisperHost Bangkok procured.
Completion Protocol: Keep pool 3, rate limit 5 logins/15min, concurrency 50-100 — verify not changed.

## Secrets — Edit Deny

Deny list from `.agents/settings.json` (and `.agents/settings.local.json`):

- `Edit: .env*`
- `Edit: *_SECRET*`
- `Edit: *_PASSWORD*`
- `Edit: *_TOKEN*`

Do NOT edit `.env*` or secret files via Edit/Write. Use allowed `.env.example` only or ask user.
