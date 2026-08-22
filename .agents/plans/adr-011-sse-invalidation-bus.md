# ADR-011 — SSE responses event as a cache-invalidation bus

**Date:** 2026-08-02 · **Status:** Accepted (user-approved plan `.agents/plans/class-tools-next.md`)

## Context
Class Tools students poll `GET /api/tools/poll` every 10s (14a: 10s + jitter) for live responses. With 50–100 concurrent students on a 1vCPU VPS, this is the dominant GET traffic. The step-change SSE connection (`/api/tools/step/sse`) already exists per student. Task 15 (SSE content push) was deferred from the v1.10.80 hardening batch.

## Decision
Add a new additive SSE event `responses` (`{"type":"responses"}`, ~20 bytes, no response data) pushed to a session's connected clients after **any** of the 7 response mutations. Clients invalidate their React Query poll queries by the 3-element prefix `['tools','poll',sessionId]` (`toolKeys.pollPrefix`); React Query refetches once per burst. While SSE is connected, response polling is paused (`refetchInterval: 0`) — Task 14b.

Rejected alternatives:
- **Full content push** (server serializes responses into the event; client `setQueryData`): wire-format duplication, step-scoping/ordering/kick edge cases, server serialization cost — rejected as over-engineered; the invalidation bus captures the same user-visible latency at ~10% of the risk.
- **Server-side event coalescing**: unnecessary — 50 submits × ≤50 clients = 2,500 × ~30B ≈ 75KB socket writes; client-side dedupe already collapses refetches per burst (senior-engineer math).

## Consequences
- Old cached clients ignore the unknown event type → backward compatible, no version coupling.
- Kicked-response removal propagates (deleteStudentResponses/deleteResponse emit the event — stale cards disappear).
- B3 safety: polling resumes automatically on SSE drop via existing transitions (onerror → backoff → polling after 3 fails); `connected === 'connected'` gates the pause — no freeze path.
- Admin ResultsView shares poll keys but never mounts SSE → no cross-contamination.
- Key-depth gotcha: `toolKeys.poll(sessionId)` is 4 elements (`'all'` sentinel) — full-key invalidation would MISS step-scoped keys; the `pollPrefix` helper is mandatory (senior-review blocker, fixed in plan).

## Constraints honored
No new DB queries (event emit only), no pool-3 impact, no schema change, no rate-limit interaction (events are server-push, not student requests).
