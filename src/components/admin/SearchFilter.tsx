'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface SearchFilterProps {
  toolTypes?: Record<string, string>;
}

export default function SearchFilter({ toolTypes }: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handleSort = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', sort);
    params.set('page', '1');

    startTransition(() => {
      router.replace(`?${params.toString()}`);
    });
  };

  const handleToolType = (type: string) => {
    const params = new URLSearchParams(searchParams);
    if (type && type !== 'all') {
      params.set('type', type);
    } else {
      params.delete('type');
    }
    params.set('page', '1');
    startTransition(() => {
      router.replace(`?${params.toString()}`);
    });
  };

  return (
    <>
      <div className="relative flex-1 min-w-[200px]">
        <i aria-hidden="true" className="fi fi-sr-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="ค้นหา..."
          defaultValue={searchParams.get('q')?.toString()}
          onChange={(e) => {
            const term = e.target.value;
            const params = new URLSearchParams(searchParams);
            if (term) {
              params.set('q', term);
            } else {
              params.delete('q');
            }
            params.set('page', '1');
            startTransition(() => {
              router.replace(`?${params.toString()}`);
            });
          }}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        />
      </div>
      <div className="relative">
        <select
          defaultValue={searchParams.get('sort')?.toString() || 'latest'}
          onChange={(e) => handleSort(e.target.value)}
          className="appearance-none w-full pl-4 pr-10 py-2 rounded-xl bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="latest">ใหม่สุด (Latest)</option>
          <option value="oldest">เก่าสุด (Oldest)</option>
          <option value="name_asc">ชื่อ A-Z</option>
          <option value="name_desc">ชื่อ Z-A</option>
        </select>
        <i aria-hidden="true" className="fi fi-sr-angle-small-down absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
      </div>
      {toolTypes && (
        <div className="relative">
          <select
            defaultValue={searchParams.get('type')?.toString() || 'all'}
            onChange={(e) => handleToolType(e.target.value)}
            className="appearance-none w-full pl-4 pr-10 py-2 rounded-xl bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">ทุกประเภท (All)</option>
            {Object.entries(toolTypes).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <i aria-hidden="true" className="fi fi-sr-angle-small-down absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
      )}
    </>
  );
}
