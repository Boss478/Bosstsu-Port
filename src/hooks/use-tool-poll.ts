import { useQuery } from '@tanstack/react-query';
import { toolKeys } from '@/lib/query/keys';

export function useToolPoll(sessionId: string, stepIndex?: number, interval?: number) {
  const queryKey = toolKeys.poll(sessionId);

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const stepParam = stepIndex !== undefined ? `&stepIndex=${stepIndex}` : '';
      const res = await fetch(`/api/tools/poll?sessionId=${sessionId}${stepParam}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    refetchInterval: interval ?? 10_000,
  });

  return { data, isLoading, refetch, queryKey };
}
