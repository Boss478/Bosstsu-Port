'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { CONFIG } from '@/lib/config';

const PAGE_SIZE_OPTIONS = CONFIG.PAGINATION.SIZE_OPTIONS;

export default function PageSizeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const currentLimit = searchParams.get('limit')
    ? parseInt(searchParams.get('limit')!)
    : CONFIG.PAGINATION.DEFAULT_LIMIT;

  const handleChange = (limit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', limit.toString());
    params.set('page', '1');
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
        แสดง:
      </span>
      <select
        value={currentLimit}
        onChange={(e) => handleChange(parseInt(e.target.value))}
        className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}
