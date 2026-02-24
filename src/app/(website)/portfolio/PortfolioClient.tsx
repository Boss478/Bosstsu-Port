"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { type PortfolioItem, formatDate } from "./data";
import Breadcrumb from "@/components/Breadcrumb";

const ITEMS_PER_PAGE = 15;

export default function PortfolioClient({ initialItems }: { initialItems: PortfolioItem[] }) {
  const [activeTag, setActiveTag] = useState<string>("ทั้งหมด");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const uniqueTags = useMemo(() => {
    const set = new Set<string>();
    initialItems.forEach((item) => item.tags.forEach((t) => set.add(t)));
    return ["ทั้งหมด", ...Array.from(set)];
  }, [initialItems]);

  const filteredAndSortedItems = useMemo(() => {
    const items =
      activeTag === "ทั้งหมด"
        ? [...initialItems]
        : initialItems.filter((item) => item.tags.includes(activeTag));

    items.sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortOrder === "desc" ? -diff : diff;
    });

    return items;
  }, [activeTag, sortOrder, initialItems]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE);
  const pagedItems = filteredAndSortedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function filterByTag(tag: string) {
    setActiveTag(tag);
    setCurrentPage(1);
  }

  function toggleSortOrder() {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setCurrentPage(1);
  }


  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950">

      <section id="portfolio-header" className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">

          <Breadcrumb items={[{ label: "ผลงาน" }]} />

          <h1 className="text-4xl md:text-5xl font-bold text-sky-600 dark:text-sky-400">
            ผลงาน
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            รวบรวมโปรเจกต์ ผลงาน และกิจกรรมต่าง ๆ
          </p>
        </div>
      </section>


      <section id="portfolio-filter-bar" className="px-4 pb-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">

          <select
            value={activeTag}
            onChange={(e) => filterByTag(e.target.value)}
            className="px-4 py-1.5 rounded-full text-sm font-medium bg-white/70 dark:bg-slate-800/60 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-slate-700 hover:bg-sky-100 dark:hover:bg-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all duration-200 cursor-pointer"
          >
            {uniqueTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>


          <button
            onClick={toggleSortOrder}
            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-white/70 dark:bg-slate-800/60 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-slate-700 hover:bg-sky-100 dark:hover:bg-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all duration-200 cursor-pointer"
          >
            <i className="fi fi-sr-calendar text-xs" />
            {sortOrder === "desc" ? "ใหม่สุด" : "เก่าสุด"}
            <i
              className={`fi fi-sr-arrow-${sortOrder === "desc" ? "down" : "up"} text-xs transition-transform duration-200`}
            />
          </button>
        </div>
      </section>


      <section id="portfolio-grid" className="pb-20 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pagedItems.map((item) => (
              <Link
                key={item.id}
                href={`/portfolio/${item.id}`}
                className="group flex flex-col bg-white dark:bg-slate-900/60 dark:backdrop-blur-xs rounded-2xl border border-transparent dark:border-slate-700/50 overflow-hidden shadow-md shadow-sky-100/40 dark:shadow-black/20 hover:shadow-xl hover:shadow-sky-200/50 dark:hover:shadow-black/40 hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="relative w-full shrink-0 overflow-hidden bg-sky-50 dark:bg-slate-800 flex items-center justify-center" style={{ height: '14rem' }}>
                  {item.cover ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.cover}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 z-10"
                        onError={(e) => {
                           e.currentTarget.style.display = 'none';
                        }}
                      />
                      {/* Fallback icon shown if image fails to load or while loading */}
                      <div className="absolute inset-0 flex items-center justify-center bg-sky-50 dark:bg-slate-800 z-0">
                         <i className="fi fi-sr-briefcase text-4xl text-sky-200 dark:text-slate-600 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    </>
                  ) : (
                    <i className="fi fi-sr-briefcase text-4xl text-sky-200 dark:text-slate-600 group-hover:scale-110 transition-transform duration-500" />
                  )}

                  {/* Gallery photo count badge (top-left) */}
                  {item.gallery && item.gallery.length > 0 && (
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/50 dark:bg-black/60 text-zinc-900 dark:text-zinc-100 text-[10px] font-semibold backdrop-blur-3xs shadow-sm">
                      <i className="fi fi-sr-picture text-sky-500 text-[10px]" />
                      {item.gallery.length}
                    </div>
                  )}

                  {/* Tools badge (top-right) */}
                  {item.tools && item.tools.length > 0 && (
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/50 dark:bg-black/60 text-zinc-900 dark:text-zinc-100 text-[10px] font-semibold backdrop-blur-xs shadow-sm">
                      <i className="fi fi-sr-tools text-sky-500 text-[10px]" />
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
                          className="px-2 py-0.5 rounded-md text-sm font-semibold bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors duration-300 line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                  </header>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-8">
                    {item.description}
                  </p>

                  {/* Bottom section: Date & Action */}
                  <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                      <i className="fi fi-sr-calendar-lines" />
                      {formatDate(item.date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600 dark:text-sky-400 group-hover:text-sky-500 transition-colors duration-300">
                      อ่านต่อ
                      <i className="fi fi-sr-arrow-right text-[10px] transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>


          {totalPages > 1 && (
            <div id="portfolio-pagination" className="flex justify-center items-center gap-2 mt-12">

              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:bg-sky-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
              >
                <i className="fi fi-sr-angle-left" />
              </button>


              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      currentPage === page
                        ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                        : "text-zinc-500 dark:text-zinc-400 hover:bg-sky-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}


              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:bg-sky-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
              >
                <i className="fi fi-sr-angle-right" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
