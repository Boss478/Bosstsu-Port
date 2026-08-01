// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useToolPoll } from '@/hooks/use-tool-poll';

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

    expect(result.current.queryKey).toEqual(['tools', 'poll', SESSION_ID]);
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
      const query = queryClient.getQueryCache().find(['tools', 'poll', SESSION_ID]);
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
      const query = queryClient.getQueryCache().find(['tools', 'poll', SESSION_ID]);
      expect(query).toBeDefined();
    });
  });

  it('includes stepIndex in fetch URL when provided', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ responses: [] }), { status: 200 }));

    renderHook(() => useToolPoll(SESSION_ID, 0), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(`/api/tools/poll?sessionId=${SESSION_ID}&stepIndex=0`);
    });

    fetchSpy.mockRestore();
  });

  it('omits stepIndex from fetch URL when not provided', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ responses: [] }), { status: 200 }));

    renderHook(() => useToolPoll(SESSION_ID), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(`/api/tools/poll?sessionId=${SESSION_ID}`);
    });

    fetchSpy.mockRestore();
  });
});
