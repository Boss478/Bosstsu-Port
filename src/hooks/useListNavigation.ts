import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface UseListNavigationConfig {
  basePath: string;
  filterKey: string;
  allLabel?: string;
}

export function useListNavigation(config: UseListNavigationConfig) {
  const { basePath, filterKey, allLabel = 'ทั้งหมด' } = config;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function buildParams(overrides: Record<string, string>): URLSearchParams {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(overrides)) {
      if (value && value !== allLabel) params.set(key, value);
    }
    return params;
  }

  function navigateToPage(page: number, activeFilter: string, sort: string) {
    startTransition(() => {
      const params = buildParams({ page: String(page), [filterKey]: activeFilter, sort });
      if (!params.has('page')) params.set('page', String(page));
      if (!params.has('sort')) params.set('sort', sort);
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  function filterBy(filter: string, sort: string) {
    startTransition(() => {
      const params = buildParams({ page: '1', [filterKey]: filter, sort });
      if (!params.has('sort')) params.set('sort', sort);
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  function changeSort(newSort: string, activeFilter: string) {
    startTransition(() => {
      const params = buildParams({ page: '1', [filterKey]: activeFilter, sort: newSort });
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  function searchBy(query: string, activeFilter: string, sort: string) {
    startTransition(() => {
      const params = buildParams({ q: query, [filterKey]: activeFilter, sort });
      if (!params.has('page')) params.set('page', '1');
      if (!params.has('sort')) params.set('sort', sort);
      router.replace(`${basePath}?${params.toString()}`);
    });
  }

  return { navigateToPage, filterBy, changeSort, searchBy, isPending };
}
