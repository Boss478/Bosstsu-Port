# TanStack Query Research — Boss478 Portfolio

**Date:** 2026-07-25  
**Context:** Research into adopting TanStack Query v5 as a client-side data fetching layer.

---

## Current State

The codebase uses **zero data-fetching libraries**. All data fetching is via two patterns:

### Server Components — Direct Mongoose + ISR
Public pages (`/portfolio`, `/gallery`, `/resources`, `/games`) use async server components querying MongoDB directly via `fetchPublished()` or `Model.find()`, with `export const revalidate = 60`. These are **optimal as-is** — no client-side fetching needed.

### Client Components — Raw `useEffect` + `fetch()`
**~15+ components** duplicate this boilerplate:

```
'use client'
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  fetch(url).then(r => r.json()).then(setData).catch(setError).finally(() => setLoading(false))
}, [url])
```

Affected areas:
| Area | Files | Current Pain |
|------|-------|-------------|
| **Stocks** | `StockDataContext.tsx` | Manual `Map` cache with TTL, `refreshPromiseRef` for dedup, exponential backoff reimplemented, `historyCacheVersion` counter |
| **Finance** | `BudgetList.tsx`, `TransactionList.tsx`, `SubscriptionList.tsx`, `FinanceClient.tsx`, `FinanceSummary.tsx` | Each has own `loading`/`error`/`fetchData` — identical code repeated |
| **Tools** | `PadletBoard.tsx`, `MentimeterPoll.tsx`, `ResultsView.tsx`, `QABoard.tsx` | Manual `setInterval` polling deduplicated per component |
| **Analytics** | `AnalyticsDashboardClient.tsx` | Custom interval + visibility change handling |
| **Audio** | `useAudio.ts` | LRU Map + IndexedDB cache, serialized fetch queue |

---

## TanStack Query v5 — What It Provides

### Core Primitives

| Primitive | Purpose | Equivalent to your codebase |
|-----------|---------|---------------------------|
| `useQuery` | Fetch + cache data | `useEffect + fetch + loading/error state` |
| `useMutation` | Create/update/delete + auto-refetch | `fetch POST/PATCH/DELETE + manual setState + refetchData()` |
| `queryClient.invalidateQueries` | Mark cached data stale | `setHistoryCacheVersion(n+1)` in StockDataContext |
| `queryClient.setQueryData` | Optimistic cache update | Manual state merge after mutation |
| `refetchInterval` | Auto-polling | Custom `setInterval` in 5+ components |
| `staleTime` / `gcTime` | Cache TTL | Manual `CACHE_TTL` Map + LRU eviction |

### Key Configuration for This Codebase

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,            // Match ISR revalidate window
      gcTime: 30 * 60 * 1000,          // Keep cache for back-navigation
      retry: 2,                         // Matches existing exponential backoff
      refetchOnWindowFocus: true,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
  },
})
```

### SSR / Hydration Pattern for Next.js App Router

For prefetching data in server components + hydrating into client components:

```tsx
// Server Component
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

export default async function Page() {
  const qc = new QueryClient()
  await qc.prefetchQuery({ queryKey: ['holdings'], queryFn: getHoldings })
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ClientComponent />
    </HydrationBoundary>
  )
}
```

The QueryClient must be:
- **Server:** New instance per request
- **Client:** Module-level singleton (avoid `useState` — React may discard on suspend)

---

## Migration Plan

### Phase 1 — Foundation

**Files to create:**
- `src/lib/query/providers.tsx` — QueryClientProvider + ReactQueryDevtools (lazy loaded)
- `src/lib/query/keys.ts` — Query key factories using `queryOptions()` for type safety

**Files to modify:**
- `src/app/layout.tsx` — Add `<QueryProvider>` wrapping `<ThemeProvider>`

**Install:** `@tanstack/react-query @tanstack/react-query-devtools`

---

### Phase 2 — Finance Module (encapsulated, medium risk)

Migrate these files in order:

| File | Replaced With |
|------|--------------|
| `BudgetList.tsx` | `useQuery` for budgets + transactions, `useMutation` for budget CRUD |
| `TransactionList.tsx` | `useQuery` with filter params, `useMutation` with optimistic update |
| `SubscriptionList.tsx` | `useQuery` + `useMutation` with cache invalidation |
| `FinanceClient.tsx` | Composes query hooks instead of manual fetch on tab switch |
| `FinanceSummary.tsx` | `useQuery` composability |

**Expected:** Each component shrinks ~40-50%. Loading/error/refetch are free.

---

### Phase 3 — Stocks Dashboard (highest risk, most complex)

**Target:** `StockDataContext.tsx`

This is the most sophisticated client state in the codebase. Migration strategy:

1. **Break into separate hooks:**
   - `useStockQuotes()` — `useQuery` with `refetchInterval`, replaces manual interval + backoff
   - `useStockHistory(symbol, period)` — `useQuery` with `staleTime` per period, replaces Map cache
   - `useHoldings()` — `useQuery` to `/boss478/api/holdings`
   - `useWatchlist()` — `useQuery` to `/boss478/api/watchlist`
   - `useAddToWatchlist()` / `useRemoveFromWatchlist()` — `useMutation` with optimistic cache

2. **Context slims down** to pure UI state:
   - `selectedTab`, `selectedPeriod`, `searchQuery`
   - Composes query hooks internally

3. **Mutations use optimistic updates:**
   ```ts
   useMutation({
     mutationFn: addHolding,
     onMutate: async (newHolding) => {
       await qc.cancelQueries({ queryKey: ['holdings'] })
       const prev = qc.getQueryData(['holdings'])
       qc.setQueryData(['holdings'], (old) => [...old, newHolding])
       return { prev }
     },
     onError: (err, vars, context) => {
       qc.setQueryData(['holdings'], context.prev) // rollback
     },
     onSettled: () => qc.invalidateQueries({ queryKey: ['holdings'] }),
   })
   ```

---

### Phase 4 — Classroom Tools (low risk)

**Target:** `PadletBoard.tsx`, `MentimeterPoll.tsx`, `ResultsView.tsx`, `QABoard.tsx`

Replace manual polling:
```tsx
// Before
useEffect(() => {
  const id = setInterval(() => fetchData(), 10_000)
  return () => clearInterval(id)
}, [sessionId])

// After
const { data, isLoading, error } = useQuery({
  queryKey: ['poll-responses', sessionId],
  queryFn: () => fetch(`/api/tools/poll?sessionId=${sessionId}`).then(r => r.json()),
  refetchInterval: 10_000,
})
```

Mutations (submit/edit/delete) use `useMutation` with `onSuccess: () => qc.invalidateQueries(...)`.

**SSE stays as-is** (`use-sse.ts`) — real-time event-driven connections are outside TanStack Query's scope.

---

### Phase 5 — Analytics (low risk)

**Target:** `AnalyticsDashboardClient.tsx`

Replace:
```ts
// Before: custom interval + tab visibility check
useEffect(() => {
  const t = setTimeout(fetchData, 3000)
  return () => clearTimeout(t)
}, [data, isVisible])

// After
useQuery({
  queryKey: ['analytics-stats'],
  queryFn: fetchAnalytics,
  refetchInterval: 3000,
  refetchIntervalInBackground: false, // respects tab visibility
})
```

---

## What NOT to Change

| Area | Reason |
|------|--------|
| **Public pages** (portfolio/gallery/resources/games) | Server components with direct DB + ISR — optimal |
| **SSE / `use-sse.ts`** | Real-time event-driven, not polling |
| **Server Actions** (admin CRUD forms) | Unless converting to `useMutation` + client cache sync — not worth complexity |
| **Analytics queue** (`analytics/queue.ts`) | Fire-and-forget event batching, not query/mutation |
| **Pyodide / word games** | In-browser computation, not server data |
| **Dictionary audio** (`useAudio.ts`) | Complex two-layer cache + serialized queue — would need significant refactor with marginal gain |

---

## Query Key Factory Design (recommended)

```ts
// src/lib/query/keys.ts
import { queryOptions } from '@tanstack/react-query'

// Stocks
export const stockKeys = {
  all: ['stocks'] as const,
  quotes: () => [...stockKeys.all, 'quotes'] as const,
  history: (symbol: string, period: string) =>
    [...stockKeys.all, 'history', symbol, period] as const,
  holdings: () => [...stockKeys.all, 'holdings'] as const,
  watchlist: () => [...stockKeys.all, 'watchlist'] as const,
} as const

// Finance
export const financeKeys = {
  all: ['finance'] as const,
  budgets: (month: string) => [...financeKeys.all, 'budgets', month] as const,
  transactions: (filters?: Record<string, string>) =>
    [...financeKeys.all, 'transactions', filters] as const,
  subscriptions: () => [...financeKeys.all, 'subscriptions'] as const,
} as const

// Tools
export const toolKeys = {
  all: ['tools'] as const,
  poll: (sessionId: string) => [...toolKeys.all, 'poll', sessionId] as const,
  participants: (sessionId: string) => [...toolKeys.all, 'participants', sessionId] as const,
  step: (sessionId: string) => [...toolKeys.all, 'step', sessionId] as const,
} as const

// Analytics
export const analyticsKeys = {
  all: ['analytics'] as const,
  stats: () => [...analyticsKeys.all, 'stats'] as const,
} as const
```

---

## Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| Lines of fetch boilerplate | ~2000 across all components | ~800 |
| Loading/error states | Inconsistent per component | Unified by framework |
| Cache invalidation | Manual Map TTL + version counters | `staleTime`/`gcTime` + `invalidateQueries` |
| Polling infrastructure | 5+ custom `setInterval` implementations | 1 `refetchInterval` config per query |
| Optimistic updates | None | `onMutate`/`onError`/`onSettled` lifecycle |
| Dev tooling | `console.log` | React Query Devtools (inspect cache, refetch, mock) |

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x"
  },
  "devDependencies": {
    "@tanstack/react-query-devtools": "^5.x"
  }
}
```

No other dependencies needed — `fetch()` is sufficient for API calls. The library is 22KB gzipped.

---

## References

- [TanStack Query v5 docs](https://tanstack.com/query/v5/docs/framework/react/overview)
- [Advanced SSR with Next.js App Router](https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr)
- [Query key factory pattern](https://tanstack.com/query/v5/docs/framework/react/guides/query-keys)
- [Devtools](https://tanstack.com/query/v5/docs/framework/react/devtools)
