---
version: v1.9.13
date: 2026-05-25
status: Draft
---

# Scalability Roadmap v2 — 100 Now, Future-Ready for 500+

**Current version:** v1.9.13
**Target version:** v1.10.0
**Date:** 2026-05-25
**Status:** Draft

## Overview

Three-phase plan to:
1. **Phase 1 (NOW)** — ~30 min: Support 100 concurrent study session students with code/config changes
2. **Phase 2 (NOW)** — ~2 hrs: Restructure in-memory state to MongoDB TTL (unlocks horizontal scaling)
3. **Phase 3 (FUTURE)** — When needed: Add load balancer + multi-instance + Redis for 500+

Architecture principle: **Design for horizontal scaling now, deploy it later.** All Phase 2 changes use
MongoDB TTL indexes — same key-value pattern as Redis, so a future Redis migration is swap one import.

---

## Why & How

### Phase 1 Decision: Why These Items?

| Item | Why | Effort | Impact |
|------|-----|--------|--------|
| **Pool 3→7** | MongoDB pool is the tightest bottleneck. 3 slots = only 3 concurrent DB ops. With ~50 users × 6 polls/min, queries queue immediately. 7 slots gives headroom for 200+ users. | 1 line | ~2x DB throughput |
| **Session status cache** | Poll endpoint hits `ToolSession.findById()` every single poll — 40x/min for 40 students. Session status changes only when teacher clicks "End". 5s TTL eliminates ~1/3 of poll DB queries. | ~15 lines | -240 queries/min at 40 students |
| **Docker memory limits** | No OOM guard currently. MongoDB WiredTiger takes ~50% host RAM + 1GB by default. Under 100+ concurrent load, memory pressure causes OOM kills. | 10 lines | Prevents crash at scale |
| **Health endpoint** | No way for Docker to detect hung Node.js. If event loop stalls (stuck DB reconnect), container stays alive but serves nothing. | ~15 lines | Auto-recovery on hang |
| **Distinct cache** | Every public list page runs `distinct()` = full collection scan. With 50+ browse users, this saturates DB. 60s TTL reduces to 1 scan/min. | ~20 lines | -N full scans/min |
| **ISR tuning** | `revalidate=60` on gallery/portfolio/resources lists means up to 60 re-renders/hour each. At 100 concurrent users, re-renders compete with polling requests for CPU. | 3 lines | -80% re-render CPU |

### Phase 2 Decision: Why MongoDB TTL (Not Redis)?

**Chosen: MongoDB TTL index**

- Zero new infra — uses existing MongoDB, no extra Docker container
- TTL index auto-deletes expired documents — no cleanup code needed
- Same key-value pattern as Redis -> future Redis migration is changing one import
- Cost: ~1 extra DB write per rate-limited action (negligible at 100 users)
- Risk: Lower than Redis (no new failure mode, no new config)

**Rejected: Redis**

- Adds operational complexity (new container, memory allocation, config)
- Overkill for 100 users — Redis shines at 1000+ with sub-ms reads
- Can add later when truly needed — the MongoDB TTL abstraction makes it a smooth swap

**Rejected: Keep in-memory**

- Blocks horizontal scaling entirely — each instance has its own isolated Maps
- Session cache, distinct cache remain in-memory (fine — they're non-critical, lost on restart)
- Rate limiter and Pyodide input are correctness-critical across instances

### Phase 3 Decision: Architecture for 500+

When the time comes:
- **Load balancer**: Caddy already configured — add `reverse_proxy app:3300 app2:3300`
- **Redis**: Replace MongoDB TTL collections with Redis `SETEX` — same key-value interface
- **Shared storage**: Uploads already on bind mount (works for same-host containers); for multi-VPS, switch to MinIO or Cloudflare R2
- **Scaling strategy**: Prefer vertical (2 vCPU) before horizontal — simpler, lower cost at moderate scale

---

## Phase 1 — 100-User Capacity (NOW)

### 1.1 MongoDB Pool 3->7

**File:** `src/lib/config.ts:52-55`

**Current:**
```typescript
POOL: {
  MAX: 3,
  MIN: 1,
},
```

**Proposed:**
```typescript
POOL: {
  MAX: 7,
  MIN: 2,
},
```

**Why:** 3 slots saturate at ~50 users (6 polls/min x 3 queries = 900 qpm = 15 qps sustained). 7 slots handles ~200 users at same query pattern. MIN: 2 keeps 2 warm connections during idle periods. Memory cost: ~4 MB extra (each connection ~1 MB).

### 1.2 Session.isActive Cache (5s TTL) + hasMore Optimization

**File:** `src/app/api/tools/poll/route.ts`

**Current (lines 31-43):** 3 DB queries per poll:
- `ToolResponse.find().sort().limit().lean()`
- `ToolSession.findById().lean()`
- `ToolResponse.countDocuments()`

**Proposed:** 1-2 queries per poll:
- `ToolResponse.find().sort().limit(N+1).lean()` (fetch 1 extra for hasMore check)
- `ToolSession.findById().select('isActive')` — cached with 5s TTL
- Remove countDocuments entirely — use hasMore boolean

**Module-level cache:**
```typescript
const sessionCache = new Map<string, { isActive: boolean; expiresAt: number }>();
const CACHE_TTL = 5000;

function getCachedSessionStatus(
  sessionId: string,
  session: { isActive: boolean } | null
): boolean {
  if (!session) return false;
  return session.isActive;
}
```

**DB queries per poll: 3 -> 1 (cache hit) / 2 (cache miss).** At 40 students x 6 polls/min: 720 -> 240 queries/min. **-480 queries/min.**

### 1.3 Docker Memory Limits

**File:** `docker-compose.yml`

Add to app service:
```yaml
deploy:
  resources:
    limits:
      memory: 1024M
environment:
  - NODE_OPTIONS=--max-old-space-size=512
```

Add to mongo service:
```yaml
deploy:
  resources:
    limits:
      memory: 1536M
command: ["mongod", "--wiredTigerCacheSizeGB", "1"]
```

Add to mongo-express service:
```yaml
deploy:
  resources:
    limits:
      memory: 128M
```

**File:** `dockerfile` (runner stage)

Add after `ENV NODE_ENV=production`:
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=512"
```

### 1.4 Health Endpoint

**New file:** `src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ status: 'ok', db: 'connected' }, { status: 200 });
  } catch {
    return NextResponse.json({ status: 'error', db: 'disconnected' }, { status: 503 });
  }
}
```

Add to docker-compose.yml app service:
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3300/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

### 1.5 Distinct Caching

**New file:** `src/lib/query-cache.ts`

```typescript
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const TTL = 60_000;

export async function cachedDistinct<T>(
  key: string,
  fetcher: () => Promise<T[]>
): Promise<T[]> {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expiresAt > now) {
    return entry.data as T[];
  }
  const data = await fetcher();
  cache.set(key, { data, expiresAt: now + TTL });
  return data;
}
```

Apply in list pages (`games/page.tsx`, `portfolio/page.tsx`, `gallery/page.tsx`, `resources/page.tsx`) by wrapping their `distinct()` calls.

### 1.6 ISR Revalidation Tuning

| File | Current | Proposed |
|------|---------|----------|
| `portfolio/page.tsx` | `revalidate = 60` | `revalidate = 300` |
| `gallery/page.tsx` | `revalidate = 60` | `revalidate = 300` |
| `resources/page.tsx` | `revalidate = 60` | `revalidate = 300` |
| `games/page.tsx` | `revalidate = 60` | `revalidate = 300` |
| `gallery/[id]/page.tsx` | `revalidate = 60` | `revalidate = 300` |
| `portfolio/[id]/page.tsx` | `revalidate = 60` | `revalidate = 300` |
| `resources/[id]/page.tsx` | `revalidate = 60` | `revalidate = 300` |

---

## Phase 2 — Future-Proof Architecture (NOW)

### 2.1 Rate Limiter -> MongoDB TTL

**New file:** `src/models/RateLimit.ts`

```typescript
import mongoose, { Schema, Model } from 'mongoose';

interface IRateLimit {
  key: string;
  attempts: number;
  lastAttempt: Date;
  lockedUntil: Date | null;
  createdAt: Date;
}

const RateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  attempts: { type: Number, required: true, default: 0 },
  lastAttempt: { type: Date, required: true },
  lockedUntil: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

RateLimitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });
RateLimitSchema.index({ lockedUntil: 1 }, { sparse: true });

const RateLimit: Model<IRateLimit> =
  mongoose.models.RateLimit || mongoose.model<IRateLimit>('RateLimit', RateLimitSchema);

export default RateLimit;
```

**New file:** `src/models/ToolsRateLimit.ts`

```typescript
import mongoose, { Schema, Model } from 'mongoose';

interface IToolsRateLimit {
  key: string;
  count: number;
  resetAt: Date;
  createdAt: Date;
}

const ToolsRateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 1 },
  resetAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

ToolsRateLimitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 });

const ToolsRateLimit: Model<IToolsRateLimit> =
  mongoose.models.ToolsRateLimit || mongoose.model<IToolsRateLimit>('ToolsRateLimit', ToolsRateLimitSchema);

export default ToolsRateLimit;
```

**Modified:** `src/lib/rate-limit.ts`

Replace in-memory `Map<>` operations with MongoDB queries using the models above. All 4 functions (`checkRateLimit`, `recordFailedAttempt`, `resetAttempts`, `checkToolsRateLimit`) move to MongoDB. Callers (poll/route.ts, respond/route.ts) need `await` on `checkToolsRateLimit`.

### 2.2 Pyodide Input -> MongoDB TTL

**New file:** `src/models/PendingInput.ts`

```typescript
import mongoose, { Schema, Model } from 'mongoose';

interface IPendingInput {
  inputId: string;
  resolved: boolean;
  responseValue: string;
  cancelled: boolean;
  createdAt: Date;
}

const PendingInputSchema = new Schema({
  inputId: { type: String, required: true, unique: true },
  resolved: { type: Boolean, default: false },
  responseValue: { type: String, default: '' },
  cancelled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

PendingInputSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 });

const PendingInput: Model<IPendingInput> =
  mongoose.models.PendingInput || mongoose.model<IPendingInput>('PendingInput', PendingInputSchema);

export default PendingInput;
```

**Modified:** `src/app/api/pyodide-input/route.ts`

Replace `const pendingInputs = new Map<string, { resolve, timer }>()` with polling on PendingInput collection:
- GET: poll `PendingInput.findOne({ inputId: id, resolved: true })` every 500ms for up to 15s
- POST: upsert `{ inputId, resolved: true, responseValue, cancelled }`

### 2.3 CSV Export Limit

**File:** `src/app/api/tools/export/csv/route.ts`

Add `.limit(10000)` to the ToolResponse.find() call. Add warning header:
```typescript
headers['X-Export-Truncated'] = `Exported first 10000 responses. Total exceeds export limit.`;
```

---

## Phase 3 — Horizontal Scaling Preparation (FUTURE)

_Documentation only — no code changes in this version._

### 3.1 When to Activate

Trigger (any 2 of 3):
- Sustained 200+ concurrent study session students
- MongoDB pool consistently at 80%+ during peak
- Response time p95 > 500ms for poll endpoint

### 3.2 Actions

1. **Load balancer**: Caddy config `reverse_proxy app:3300 app2:3300 { lb_policy round_robin }`
2. **Scale app**: `docker compose up -d --scale app=3 --no-deps app`
3. **Redis** (optional): Replace MongoDB TTL collections with `SETEX`. Create `src/lib/cache.ts` abstraction
4. **Shared storage**: For multi-VPS, replace bind mount with MinIO or Cloudflare R2

---

## Impact Analysis

| Dimension | Before | After | Delta |
|-----------|--------|-------|-------|
| DB queries per poll | 3 | 1-2 | -33% to -67% |
| Poll latency (p50) | ~30ms | ~15ms | -50% |
| Mongo pool saturation | ~90% at 50 users | ~30% at 50 users | -60pp |
| Node heap limit | ~1.5 GB (unbounded) | 512 MB | -66% |
| Mongo cache limit | ~3 GB (unbounded) | 1 GB | -66% |
| ISR re-renders | 60/hr per page | 12/hr per page | -80% |
| Rate limiting | In-memory (per-instance) | MongoDB TTL (shared) | Enables horizontal |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Pool 7 causes Mongo memory pressure | Low | Medium | WiredTiger cache capped at 1GB. Monitor docker stats. |
| Session cache returns stale isActive | Low | Low | Max 5s delay. Student detects on next poll. |
| MongoDB TTL adds latency to auth | Low | Low | ~5ms write per failed login. Fine at 5 attempts/15min. |
| hasMore bug hides responses | Low | Low | Must match sort order. Existing index covers it. |
| Pyodide polling adds DB load | Low | Low | 30 reads max per request. 1-2 concurrent. Negligible. |

---

## Inventory

### Files to Create
| File | Phase | Description |
|------|-------|-------------|
| `src/app/api/health/route.ts` | 1 | Health check endpoint |
| `src/lib/query-cache.ts` | 1 | `cachedDistinct()` utility |
| `src/models/RateLimit.ts` | 2 | MongoDB TTL rate limiter |
| `src/models/ToolsRateLimit.ts` | 2 | MongoDB TTL tools rate limiter |
| `src/models/PendingInput.ts` | 2 | MongoDB TTL pyodide input |

### Files to Modify
| File | Phase | Changes |
|------|-------|---------|
| `src/lib/config.ts` | 1 | Pool MAX 3->7, MIN 1->2 |
| `src/app/api/tools/poll/route.ts` | 1+2 | Session cache + hasMore + async rate limit |
| `docker-compose.yml` | 1 | Memory limits + healthcheck |
| `dockerfile` | 1 | Node heap limit 512MB |
| `7 ISR pages` | 1 | revalidate 60->300 |
| `4 list pages` | 1 | Wrap distinct() with cachedDistinct() |
| `src/lib/rate-limit.ts` | 2 | MongoDB TTL model operations |
| `src/app/api/tools/respond/route.ts` | 2 | Async rate limit calls |
| `src/app/api/pyodide-input/route.ts` | 2 | Map->PendingInput polling |
| `src/app/api/tools/export/csv/route.ts` | 2 | Limit 10000 rows |

---

## Verification

### Phase 1
- [ ] `npm run build` passes
- [ ] Poll endpoint returns correct responses with `hasMore` flag
- [ ] Poll detects session ended within 5s
- [ ] `curl /api/health` returns `{"status":"ok","db":"connected"}`
- [ ] `docker compose up -d --build` starts all services
- [ ] `docker stats` shows memory limits applied
- [ ] Distinct cache returns correct data
- [ ] ISR pages revalidate after 5 min

### Phase 2
- [ ] Rate limiter blocks after 5 failed attempts, resets after 15 min
- [ ] Rate limit survives server restart
- [ ] Tools rate limit blocks at 10 req/min, survives restart
- [ ] Pyodide input resolves correctly (GET -> POST flow)
- [ ] Pyodide input times out after 15s
- [ ] CSV export with 10K+ responses returns truncation header
