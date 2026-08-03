import { useQuery } from '@tanstack/react-query';
import { toolKeys } from '@/lib/query/keys';
import { getStudentToken } from '@/lib/client-token';

export function useToolPoll(
  sessionId: string,
  stepIndex?: number,
  interval?: number,
  sseConnected?: boolean,
  code?: string,
) {
  const queryKey = toolKeys.poll(sessionId, stepIndex);

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const stepParam = stepIndex !== undefined ? `&stepIndex=${stepIndex}` : '';
      const codeParam = code ? `&code=${encodeURIComponent(code)}` : '';
      const res = await fetch(`/api/tools/poll?sessionId=${sessionId}${stepParam}${codeParam}`, {
        headers: { 'student-token': getStudentToken() },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    refetchInterval: () =>
      sseConnected ? 0 : (interval ?? 10_000) + Math.floor(Math.random() * 4_000),
  });

  return { data, isLoading, refetch, queryKey };
}
