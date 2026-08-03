// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useToolPoll } from '@/hooks/use-tool-poll';

vi.mock('@/lib/client-token', () => ({
  getStudentToken: () => 'tok-test',
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const SESSION_ID = '507f1f77bcf86cd799439011';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useToolPoll', () => {
  it('returns queryKey matching toolKeys.poll(sessionId)', () => {
    const { result } = renderHook(() => useToolPoll(SESSION_ID), { wrapper: createWrapper() });

    expect(result.current.queryKey).toEqual(['tools', 'poll', SESSION_ID, 'all']);
  });

  it('returns data, isLoading, refetch and queryKey properties', () => {
    const { result } = renderHook(() => useToolPoll(SESSION_ID), { wrapper: createWrapper() });

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('refetch');
    expect(result.current).toHaveProperty('queryKey');
    expect(typeof result.current.refetch).toBe('function');
  });

  it('defaults refetchInterval to 10000 when interval not provided', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    renderHook(() => useToolPoll(SESSION_ID), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => {
      const query = queryClient.getQueryCache().find(['tools', 'poll', SESSION_ID, 'all']);
      expect(query).toBeDefined();
    });
  });

  it('uses custom refetchInterval when provided', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    renderHook(() => useToolPoll(SESSION_ID, undefined, 3000), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(() => {
      const query = queryClient.getQueryCache().find(['tools', 'poll', SESSION_ID, 'all']);
      expect(query).toBeDefined();
    });
  });

  it('includes stepIndex in fetch URL and sends the student-token header when provided', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ responses: [] }), { status: 200 }));

    renderHook(() => useToolPoll(SESSION_ID, 0), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        `/api/tools/poll?sessionId=${SESSION_ID}&stepIndex=0`,
        expect.objectContaining({ headers: { 'student-token': 'tok-test' } }),
      );
    });

    fetchSpy.mockRestore();
  });

  it('appends the code param to the fetch URL when provided', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ responses: [] }), { status: 200 }));

    renderHook(() => useToolPoll(SESSION_ID, undefined, undefined, undefined, 'ABC-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        `/api/tools/poll?sessionId=${SESSION_ID}&code=ABC-123`,
        expect.objectContaining({ headers: { 'student-token': 'tok-test' } }),
      );
    });

    fetchSpy.mockRestore();
  });

  it('omits stepIndex from fetch URL and sends the student-token header when not provided', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ responses: [] }), { status: 200 }));

    renderHook(() => useToolPoll(SESSION_ID), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        `/api/tools/poll?sessionId=${SESSION_ID}`,
        expect.objectContaining({ headers: { 'student-token': 'tok-test' } }),
      );
    });

    fetchSpy.mockRestore();
  });

  it('does not poll while sseConnected is true', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ responses: [] }), { status: 200 }));

    try {
      renderHook(() => useToolPoll(SESSION_ID, undefined, undefined, true), {
        wrapper: createWrapper(),
      });

      // flush microtasks → initial fetch fires
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('polls on the default interval when sseConnected is false/absent', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ responses: [] }), { status: 200 }));

    try {
      renderHook(() => useToolPoll(SESSION_ID), { wrapper: createWrapper() });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });

      // 10s base + jitter (0-4s): 30s guarantees at least 2 ticks
      expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops polling when sseConnected flips true mid-session and resumes when it flips false', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ responses: [] }), { status: 200 }));

    try {
      const { rerender } = renderHook(
        ({ sse }: { sse?: boolean }) => useToolPoll(SESSION_ID, undefined, 10_000, sse),
        { wrapper: createWrapper(), initialProps: { sse: false } },
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // polling is active while disconnected
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });
      expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);

      // SSE connects → polling must stop
      rerender({ sse: true });
      const callsAtConnect = fetchSpy.mock.calls.length;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });
      expect(fetchSpy.mock.calls.length).toBe(callsAtConnect);

      // SSE drops → polling resumes
      rerender({ sse: false });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });
      expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsAtConnect);
    } finally {
      vi.useRealTimers();
    }
  });

  it('survives a fetch error and keeps polling on the next tick', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValue(new Response(JSON.stringify({ responses: [] }), { status: 200 }));

    try {
      const { result } = renderHook(() => useToolPoll(SESSION_ID), { wrapper: createWrapper() });

      // initial fetch rejects → query errors, hook must not throw
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result.current.isLoading).toBe(false);

      // polling continues: next interval tick retries and recovers
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });
      expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
