'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';

interface UseListFilterParams<T extends { title: string }> {
  items: T[];
  activeQuery: string;
  activeFilter: string;
  sort: string;
  onFilterChange: (query: string, filter: string, sort: string) => void;
  onPageChange: (page: number, filter: string, sort: string) => void;
}

export function useListFilter<T extends { title: string }>({
  items,
  activeQuery,
  activeFilter,
  sort,
  onFilterChange,
  onPageChange,
}: UseListFilterParams<T>) {
  const [localQuery, setLocalQuery] = useState(activeQuery);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const activeFilterRef = useRef(activeFilter);
  const sortRef = useRef(sort);
  const activeQueryRef = useRef(activeQuery);
  const onFilterChangeRef = useRef(onFilterChange);
  const onPageChangeRef = useRef(onPageChange);

  useEffect(() => {
    activeFilterRef.current = activeFilter;
    sortRef.current = sort;
    activeQueryRef.current = activeQuery;
    onFilterChangeRef.current = onFilterChange;
    onPageChangeRef.current = onPageChange;
  });

  const filteredItems = useMemo(() => {
    if (!localQuery) return items;
    const q = localQuery.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [items, localQuery]);

  useEffect(() => {
    clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      if (localQuery !== activeQueryRef.current) {
        onFilterChangeRef.current(localQuery, activeFilterRef.current, sortRef.current);
      }
    }, 800);
    return () => clearTimeout(syncTimeoutRef.current);
  }, [localQuery]);

  const handlePageChange = useCallback((page: number) => {
    onPageChangeRef.current(page, activeFilterRef.current, sortRef.current);
  }, []);

  return { localQuery, setLocalQuery, filteredItems, handlePageChange };
}
