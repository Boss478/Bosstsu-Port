"use client";

import { useTransition, useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import Breadcrumb from "@/components/Breadcrumb";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import type { GameItem } from "./data";
import { useListNavigation } from "@/hooks/useListNavigation";

interface GamesClientProps {
  items: GameItem[];
  uniqueCategories: string[];
  currentPage: number;
  totalPages: number;
  activeCategory: string;
  activeQuery: string;
  sort: "desc" | "asc";
  total: number;
}

export default function GamesClient({
  items,
  uniqueCategories,
  currentPage,
  totalPages,
  activeCategory,
  activeQuery,
  sort,
  total,
}: GamesClientProps) {
  const { navigateToPage, filterBy, changeSort, searchBy } = useListNavigation({
    basePath: '/games',
    filterKey: 'category',
  });
  const router = useRouter();
  const [localQuery, setLocalQuery] = useState(activeQuery);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const filteredItems = useMemo(() => {
    if (!localQuery) return items;
    const q = localQuery.toLowerCase();
    return items.filter(item => item.title.toLowerCase().includes(q));
  }, [items, localQuery]);

  useEffect(() => {
    clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      if (localQuery !== activeQuery) searchBy(localQuery, activeCategory, sort);
    }, 800);
    return () => clearTimeout(syncTimeoutRef.current);
  }, [localQuery]);

  const handlePageChange = (page: number) => {
    navigateToPage(page, activeCategory, sort);
  };

  const allCategories = ["ทั้งหมด", ...uniqueCategories];

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950">

      <section className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={[{ label: "เกมการศึกษา" }]} />
          <h1 className="text-4xl md:text-6xl font-black text-blue-600 dark:text-blue-400 mt-6 tracking-tight">
            เกมการศึกษา
          </h1>
          <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400 font-medium">
            เกมการเรียนรู้ในหมวดหมู่ต่าง ๆ
          </p>
          <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
            ทั้งหมด {total} รายการ
          </p>
        </div>
      </section>

      <section className="px-4 pb-6">
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
            {allCategories.map((cat) => (
              <button
                key={cat}
              onClick={() => filterBy(cat, sort)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                  activeCategory === cat
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                    : "bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 text-zinc-600 dark:text-zinc-300 hover:bg-blue-100 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => changeSort(e.target.value, activeCategory)}
            className="ml-auto px-4 py-1.5 rounded-full text-sm font-medium bg-white/70 dark:bg-slate-800/60 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-slate-700 hover:border-blue-300 focus:outline-hidden cursor-pointer"
          >
            <option value="desc">ใหม่สุด</option>
            <option value="asc">เก่าสุด</option>
          </select>
        </div>
      </section>

      <section className="pt-8 pb-20 px-4 bg-white/70 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          {filteredItems.length === 0 ? (
            <EmptyState
              title="ไม่พบเกม"
              message="ไม่มีเกมที่ตรงกับเงื่อนไขการค้นหา"
              icon="fi-sr-gamepad"
            />
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  target={item.isHtmlContent ? undefined : "_blank"}
                  rel={item.isHtmlContent ? undefined : "noopener noreferrer"}
                  className="group relative block bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-100/30 dark:shadow-black/40 border border-white/60 dark:border-slate-700/50 hover:border-blue-400/50 transition-all duration-500 hover:-translate-y-3"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {item.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.cover}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                        <i className="fi fi-sr-gamepad text-6xl text-white/50" />
                      </div>
                    )}

                    <div className="absolute bottom-4 left-6 z-20">
                      <div className="flex gap-2">
                        {item.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 rounded-xl bg-white/60 backdrop-blur-sm border border-white/70 text-blue-700 shadow-sm text-[10px] font-black uppercase tracking-tighter">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 relative">
                    <div className="absolute -top-10 right-8 w-16 h-16 rounded-3xl bg-blue-500 text-white flex items-center justify-center text-3xl shadow-2xl shadow-blue-500/50 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 z-30">
                      <i className="fi fi-sr-play"></i>
                    </div>

                    <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mb-3 group-hover:text-blue-500 transition-colors leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-6 line-clamp-2 text-sm leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-slate-800">
                      <span className="flex items-center gap-2 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        <i className="fi fi-sr-calendar text-blue-400"></i>
                        {formatDate(item.date)}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                        <i className="fi fi-sr-angle-small-right"></i>
                      </div>
                    </div>
                  </div>
                </a>
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
