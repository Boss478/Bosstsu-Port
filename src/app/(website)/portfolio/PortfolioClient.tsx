"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from "next/link";
import Image from "next/image";
import { type PortfolioItem } from "./data";
import { formatShortDate } from "@/lib/format";
import Breadcrumb from "@/components/Breadcrumb";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import { useListNavigation } from "@/hooks/useListNavigation";

interface PortfolioClientProps {
  items: PortfolioItem[];
  uniqueTags: string[];
  currentPage: number;
  totalPages: number;
  activeTag: string;
  activeQuery: string;
  sort: "desc" | "asc";
  total: number;
}

export default function PortfolioClient({
  items,
  uniqueTags,
  currentPage,
  totalPages,
  activeTag,
  activeQuery,
  sort,
  total,
}: PortfolioClientProps) {
  const { navigateToPage, filterBy, changeSort, searchBy } = useListNavigation({
    basePath: '/portfolio',
    filterKey: 'tag',
  });
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
      if (localQuery !== activeQuery) searchBy(localQuery, activeTag, sort);
    }, 800);
    return () => clearTimeout(syncTimeoutRef.current);
  }, [localQuery]);

  const handlePageChange = (page: number) => {
    navigateToPage(page, activeTag, sort);
  };

  const allTags = ["ทั้งหมด", ...uniqueTags];

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950">

      <section id="portfolio-header" className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">

          <Breadcrumb items={[{ label: "ผลงาน" }]} />

          <h1 className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400">
            ผลงาน
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            รวบรวมโปรเจกต์ ผลงาน และกิจกรรมต่าง ๆ
          </p>
          <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
            ทั้งหมด {total} รายการ
          </p>
        </div>
      </section>


      <section id="portfolio-filter-bar" className="px-4 pb-6">
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
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => filterBy(tag, sort)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                  activeTag === tag
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                    : "bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 text-zinc-600 dark:text-zinc-300 hover:bg-blue-100 dark:hover:bg-slate-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => changeSort(e.target.value, activeTag)}
            className="ml-auto px-4 py-1.5 rounded-full text-sm font-medium bg-white/70 dark:bg-slate-800/60 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-slate-700 hover:border-blue-300 focus:outline-hidden cursor-pointer"
          >
            <option value="desc">ใหม่สุด</option>
            <option value="asc">เก่าสุด</option>
          </select>
        </div>
      </section>


      <section id="portfolio-grid" className="pt-8 pb-20 px-4 bg-white/70 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto pt-8">
          {filteredItems.length === 0 ? (
            <EmptyState 
              title="ไม่พบผลงาน"
              message="ไม่มีผลงานที่ตรงกับเงื่อนไขการค้นหา"
              icon="fi-sr-briefcase"
            />
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                href={`/portfolio/${item.id}`}
                className="group flex flex-col bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 overflow-hidden shadow-xl shadow-blue-900/5 dark:shadow-black/20 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10 dark:hover:shadow-black/40 hover:bg-white/60 dark:hover:bg-slate-800/60"
                suppressHydrationWarning
              >
                <div className="relative w-full shrink-0 overflow-hidden bg-blue-100 dark:bg-slate-800 flex items-center justify-center" style={{ height: '14rem' }}>
                  {item.cover ? (
                    <>
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500 z-10"
                        onError={(e) => {
                           e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-50 dark:bg-slate-800 z-0">
                         <i className="fi fi-sr-briefcase text-4xl text-blue-200 dark:text-slate-600 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    </>
                  ) : (
                    <i className="fi fi-sr-briefcase text-4xl text-blue-200 dark:text-slate-600 group-hover:scale-110 transition-transform duration-500" />
                  )}

                  {item.gallery && item.gallery.length > 0 && (
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/50 dark:bg-black/60 text-zinc-900 dark:text-zinc-100 text-[10px] font-semibold backdrop-blur-3xs shadow-sm">
                      <i className="fi fi-sr-picture text-blue-500 text-[10px]" />
                      {item.gallery.length}
                    </div>
                  )}

                  {item.tools && item.tools.length > 0 && (
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/50 dark:bg-black/60 text-zinc-900 dark:text-zinc-100 text-[10px] font-semibold backdrop-blur-xs shadow-sm">
                      <i className="fi fi-sr-tools text-blue-500 text-[10px]" />
                      {item.tools.length}
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 p-5 lg:p-6">
                  <header className="mb-2">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-sm font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                  </header>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-8">
                    {item.description}
                  </p>

                  <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                      <i className="fi fi-sr-calendar-lines" />
                      {formatShortDate(item.date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-500 transition-colors duration-300">
                      อ่านต่อ
                      <i className="fi fi-sr-arrow-right text-[10px] transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
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
