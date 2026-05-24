"use client";

import { useTransition, useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ResourceItem } from './data';
import Breadcrumb from "@/components/Breadcrumb";
import { formatDate } from "@/lib/format";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import { useListNavigation } from "@/hooks/useListNavigation";

interface ResourcesClientProps {
  items: ResourceItem[];
  uniqueTypes: string[];
  uniqueTags: string[];
  currentPage: number;
  totalPages: number;
  activeType: string;
  activeQuery: string;
  sort: "Newest" | "Oldest";
  total: number;
}

export default function ResourcesClient({
  items,
  uniqueTypes,
  currentPage,
  totalPages,
  activeType,
  activeQuery,
  sort,
  total,
}: ResourcesClientProps) {
  const { navigateToPage, filterBy, changeSort, searchBy } = useListNavigation({
    basePath: '/resources',
    filterKey: 'type',
  });
  const router = useRouter();
  const [localQuery, setLocalQuery] = useState(activeQuery);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const filteredItems = useMemo(() => {
    if (!localQuery) return items;
    const q = localQuery.toLowerCase();
    return items.filter(item => item.title.toLowerCase().includes(q));
  }, [items, localQuery]);

  useEffect(() => {
    clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      if (localQuery !== activeQuery) searchBy(localQuery, activeType, sort);
    }, 800);
    return () => clearTimeout(syncTimeoutRef.current);
  }, [localQuery]);

  const handlePageChange = (page: number) => {
    navigateToPage(page, activeType, sort);
  };

  const allTypes = ["All", ...uniqueTypes];

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950">
      <section className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={[{ label: "สื่อการเรียนรู้" }]} />

          <h1 className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400">
            สื่อการเรียนรู้
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            เอกสารประกอบการเรียน สไลด์ และวิดีโอความรู้
          </p>
          <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
            ทั้งหมด {total} รายการ
          </p>
        </div>
      </section>

      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <i className="fi fi-sr-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-sm" />
            <input
              type="text"
              placeholder="ค้นหา..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full text-sm bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/50 text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {allTypes.map((type) => (
            <button
              key={type}
                onClick={() => filterBy(type, sort)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                activeType === type
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                  : "bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 text-zinc-600 dark:text-zinc-300 hover:bg-blue-100 dark:hover:bg-slate-700"
              }`}
            >
              {type === "All" ? "ทั้งหมด" : type}
            </button>
          ))}
        </div>

        <select
          value={sort}
            onChange={(e) => changeSort(e.target.value, activeType)}
            className="ml-auto px-4 py-1.5 rounded-full text-sm font-medium bg-white/70 dark:bg-slate-800/60 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-slate-700 hover:border-blue-300 focus:outline-hidden cursor-pointer"
        >
          <option value="Newest">ใหม่สุด</option>
          <option value="Oldest">เก่าสุด</option>
        </select>
        </div>
      </section>

      <section className="pt-8 pb-20 px-4 bg-white/70 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          {filteredItems.length === 0 ? (
            <EmptyState
              title="ไม่พบสื่อการเรียนรู้"
              message="ไม่มีสื่อการเรียนรู้ที่ตรงกับเงื่อนไขการค้นหา"
              icon="fi-sr-book-alt"
            />
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.link.startsWith('/') ? item.link : `/resources/${item.id}`}
                  className="group flex flex-col bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/60 dark:border-slate-700/50 shadow-xs hover:shadow-xl hover:shadow-blue-100/50 dark:hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-slate-800">
                    {item.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fi fi-sr-book-alt text-3xl text-zinc-400" />
                      </div>
                    )}

<div className="absolute top-2 right-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-white/40 shadow-sm ${
                          item.type === "Worksheet" ? "bg-green-500/50 text-white" :
                          item.type === "Article" ? "bg-orange-500/50 text-white" :
                          item.type === "Video" ? "bg-red-500/50 text-white" :
                          item.type === "Interactive" ? "bg-purple-500/50 text-white" : "bg-blue-500/50 text-white"
                        }`}>
                          {item.type}
                        </span>
                     </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 flex-1">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-slate-800 mt-auto">
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <i className="fi fi-sr-calendar"></i>
                        {formatDate(item.date)}
                      </span>

                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shrink-0">
                        <i className="fi fi-sr-arrow-up-right text-xs"></i>
                      </div>
                    </div>
                 </div>
                 </Link>
               ))}
             </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </section>
    </div>
  );
}
