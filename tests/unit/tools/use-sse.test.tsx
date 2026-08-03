// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSSE } from '@/lib/use-sse';
import { useToolPoll } from '@/hooks/use-tool-poll';
import { toolKeys } from '@/lib/query/keys';

vi.mock('@/lib/client-token', () => ({
  getStudentToken: () => 'tok-test',
}));

const SESSION_ID = '507f1f77bcf86cd799439011';

class MockEventSource {
  static instances: MockEventSource[] = [];
  listeners: Record<string, Array<(e: { data: string }) => void>> = {};
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;

  constructor(public url: string) {
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, cb: (e: { data: string }) => void) {
    (this.listeners[type] ||= []).push(cb);
  }

  close() {
    this.closed = true;
  }

  emit(type: string, data: unknown) {
    (this.listeners[type] || []).forEach((cb) => cb({ data: JSON.stringify(data) }));
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return {
    queryClient,
    wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    },
  };
}

beforeEach(() => {
  MockEventSource.instances = [];
  vi.stubGlobal('EventSource', MockEventSource);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// Deterministic negative-assertion flush: React Query schedules refetches via
// queueMicrotask (notifyManager), so flushing the microtask queue proves
// whether an event-triggered refetch landed — no wall-clock sleep needed.
async function flushMicrotasks() {
  await act(async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });
}

function mockPollFetch() {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify({ responses: [] }), { status: 200 }));
}

describe('useSSE responses event → poll invalidation', () => {
  it('coalesces step-scoped poll refetches within 2s and refetches after the window', async () => {
    // Coalescing gate in use-sse.ts uses Date.now(), so fake timers are needed
    // to advance past INVALIDATE_COALESCE_MS (2000ms) without wall-clock waits.
    vi.useFakeTimers();
    try {
      const fetchSpy = mockPollFetch();
      const { queryClient, wrapper } = createWrapper();

      // Step-scoped query — the exact case the 4-element key would miss
      renderHook(() => useToolPoll(SESSION_ID, 2), { wrapper });
      await flushMicrotasks();
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const queriesBefore = queryClient.getQueryCache().findAll();
      expect(queriesBefore.map((q) => q.queryKey)).toContainEqual(['tools', 'poll', SESSION_ID, 2]);

      renderHook(() => useSSE(SESSION_ID), { wrapper });
      await flushMicrotasks();
      expect(MockEventSource.instances).toHaveLength(1);
      const es = MockEventSource.instances[0];
      expect(es.url).toContain(`sessionId=${SESSION_ID}`);
      expect(Object.keys(es.listeners)).toEqual(expect.arrayContaining(['responses']));
      expect(es.listeners['responses']?.length).toBe(1);

      // The poll query must still be observed (active) at emit time
      const pollQuery = queryClient.getQueryCache().find(['tools', 'poll', SESSION_ID, 2]);
      expect(pollQuery?.getObserversCount()).toBe(1);
      expect(pollQuery?.state.fetchStatus).toBe('idle');

      // First event invalidates immediately → 1 refetch
      act(() => es.emit('responses', { type: 'responses' }));
      await flushMicrotasks();
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      // Second event lands inside INVALIDATE_COALESCE_MS (2000ms) → coalesced, no refetch
      act(() => es.emit('responses', { type: 'responses' }));
      await flushMicrotasks();
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      // Once the coalesce window passes, the next event refetches again
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000); // INVALIDATE_COALESCE_MS
      });
      act(() => es.emit('responses', { type: 'responses' }));
      await flushMicrotasks();
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('direct invalidateQueries with pollPrefix refetches a step-scoped query (mechanism check)', async () => {
    const fetchSpy = mockPollFetch();
    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useToolPoll(SESSION_ID, 2), { wrapper });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    const q = queryClient.getQueryCache().find(['tools', 'poll', SESSION_ID, 2]);
    expect(q?.getObserversCount()).toBeGreaterThan(0);

    const matched = queryClient
      .getQueryCache()
      .findAll({ queryKey: toolKeys.pollPrefix(SESSION_ID) });
    expect(matched.length).toBe(1);

    act(() => {
      queryClient.invalidateQueries({ queryKey: toolKeys.pollPrefix(SESSION_ID) });
    });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
  });

  it('direct invalidateQueries with the FULL key refetches (mechanism check 2)', async () => {
    const fetchSpy = mockPollFetch();
    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useToolPoll(SESSION_ID, 2), { wrapper });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    act(() => {
      queryClient.invalidateQueries({ queryKey: ['tools', 'poll', SESSION_ID, 2] });
    });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
  });

  it('does not refetch without a responses event', async () => {
    const fetchSpy = mockPollFetch();
    const { wrapper } = createWrapper();

    renderHook(() => useToolPoll(SESSION_ID), { wrapper });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    renderHook(() => useSSE(SESSION_ID), { wrapper });
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));
    const es = MockEventSource.instances[0];

    act(() => es.emit('step', { type: 'step', currentStep: 1, kicked: false, kickedTokens: [] }));
    act(() => es.emit('broadcast', { type: 'broadcast', message: 'hi', messageType: 'message' }));
    await flushMicrotasks();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('ignores malformed responses events', async () => {
    const fetchSpy = mockPollFetch();
    const { wrapper } = createWrapper();

    renderHook(() => useToolPoll(SESSION_ID), { wrapper });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    renderHook(() => useSSE(SESSION_ID), { wrapper });
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));
    const es = MockEventSource.instances[0];

    act(() => es.emit('responses', '{not-json'));
    await flushMicrotasks();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not invalidate other sessions on a responses event', async () => {
    const fetchSpy = mockPollFetch();
    const { wrapper } = createWrapper();

    // Query for session A only
    renderHook(() => useToolPoll(SESSION_ID), { wrapper });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    // SSE hook for a DIFFERENT session
    const OTHER_SESSION = '507f1f77bcf86cd799439022';
    renderHook(() => useSSE(OTHER_SESSION), { wrapper });
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));
    const es = MockEventSource.instances[0];

    act(() => es.emit('responses', { type: 'responses' }));
    await flushMicrotasks();

    // Session A's query must NOT be refetched by session B's event
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('useSSE lifecycle', () => {
  const HIDE_TIMEOUT_MS = 2 * 60 * 1000;
  const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 15000, 20000];

  function renderUseSSE(options: Parameters<typeof useSSE>[1] = {}) {
    return renderHook(() => useSSE(SESSION_ID, options), {
      wrapper: createWrapper().wrapper,
    });
  }

  async function mountWithTimers() {
    const rendered = renderUseSSE();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(MockEventSource.instances).toHaveLength(1);
    return rendered;
  }

  it('transitions to connected on open', async () => {
    const { result } = renderUseSSE();
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));

    expect(result.current.connected).toBe('disconnected');
    act(() => {
      MockEventSource.instances[0].onopen?.();
    });
    expect(result.current.connected).toBe('connected');
  });

  it('reconnects with backoff after a transient error', async () => {
    vi.useFakeTimers();
    try {
      await mountWithTimers();
      const es1 = MockEventSource.instances[0];

      act(() => es1.onerror?.());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(BACKOFF_DELAYS[0]);
      });

      expect(es1.closed).toBe(true);
      expect(MockEventSource.instances).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('falls back to polling after 3 consecutive failures (no 4th reconnect)', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ currentStep: 0 }), { status: 200 }));
    try {
      const { result } = await mountWithTimers();

      // failure 1 → backoff 1000ms
      act(() => MockEventSource.instances[0].onerror?.());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(BACKOFF_DELAYS[0]);
      });
      expect(MockEventSource.instances).toHaveLength(2);

      // failure 2 → backoff 2000ms
      act(() => MockEventSource.instances[1].onerror?.());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(BACKOFF_DELAYS[1]);
      });
      expect(MockEventSource.instances).toHaveLength(3);

      // failure 3 → polling fallback: no 4th EventSource, polling fetch fires
      act(() => MockEventSource.instances[2].onerror?.());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(20_000);
      });

      expect(MockEventSource.instances).toHaveLength(3);
      expect(fetchSpy).toHaveBeenCalled();
      // polling fallback is active — the poll marks the status as polling
      expect(result.current.connected).toBe('polling');
    } finally {
      vi.useRealTimers();
    }
  });

  it('marks kicked on a step event with kicked flag', async () => {
    const onKicked = vi.fn();
    const { result } = renderUseSSE({ onKicked });
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));
    const es = MockEventSource.instances[0];

    act(() => es.emit('step', { type: 'step', currentStep: 1, kicked: true, kickedTokens: [] }));
    expect(result.current.kicked).toBe(true);
    expect(result.current.currentStep).toBe(1);
    expect(onKicked).toHaveBeenCalledTimes(1);
  });

  it('marks kicked when kickedTokens contains the student token (kick without flag)', async () => {
    const { result } = renderUseSSE();
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));
    const es = MockEventSource.instances[0];

    act(() =>
      es.emit('step', { type: 'step', currentStep: 2, kicked: false, kickedTokens: ['tok-test'] }),
    );
    expect(result.current.kicked).toBe(true);
    expect(result.current.currentStep).toBe(2);
  });

  it('closes the EventSource after 2min hidden and reconnects on visible', async () => {
    vi.useFakeTimers();
    const hidden = Object.getOwnPropertyDescriptor(document, 'hidden');
    try {
      await mountWithTimers();
      const es1 = MockEventSource.instances[0];

      // hidden → close after TAB_HIDE_TIMEOUT
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      act(() => document.dispatchEvent(new Event('visibilitychange')));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(HIDE_TIMEOUT_MS);
      });
      expect(es1.closed).toBe(true);

      // visible → reconnect
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      act(() => document.dispatchEvent(new Event('visibilitychange')));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(MockEventSource.instances).toHaveLength(2);
    } finally {
      if (hidden) {
        Object.defineProperty(document, 'hidden', hidden);
      } else {
        Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      }
      vi.useRealTimers();
    }
  });

  it('closes the EventSource on unmount', async () => {
    const { unmount } = renderUseSSE();
    await waitFor(() => expect(MockEventSource.instances).toHaveLength(1));
    const es = MockEventSource.instances[0];

    unmount();
    expect(es.closed).toBe(true);
  });

  it('does not reconnect after unmount (no zombie EventSource)', async () => {
    vi.useFakeTimers();
    try {
      const { unmount } = await mountWithTimers();
      const es = MockEventSource.instances[0];
      unmount();

      // an error arriving after unmount must not schedule a reconnect
      act(() => es.onerror?.());
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });
      expect(MockEventSource.instances).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
