'use client';

import { environmentManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useState } from 'react';

const ReactQueryDevtoolsProduction = lazy(() =>
  import('@tanstack/react-query-devtools/build/modern/production.js').then((d) => ({
    default: d.ReactQueryDevtools,
  })),
);

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: true,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    if (environmentManager.isServer()) return makeQueryClient();
    return browserQueryClient ?? makeQueryClient();
  });
  const [showDevtools, setShowDevtools] = useState(false);

  useEffect(() => {
    if (!browserQueryClient) browserQueryClient = queryClient;
    (window as unknown as Record<string, unknown>).toggleReactQueryDevtools = () =>
      setShowDevtools((old) => !old);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtoolsProduction />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
