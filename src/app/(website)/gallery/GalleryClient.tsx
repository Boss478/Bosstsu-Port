"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from "next/link";
import Image from "next/image";
import { type GalleryAlbum } from "./data";
import { formatShortDate } from "@/lib/format";
import Breadcrumb from "@/components/Breadcrumb";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import { useListNavigation } from "@/hooks/useListNavigation";

interface GalleryClientProps {
  items: GalleryAlbum[];
  uniqueTags: string[];
  currentPage: number;
  totalPages: number;
  activeTag: string;
  activeQuery: string;
  sort: "desc" | "asc";
  total: number;
}

export default function GalleryClient({
  items,
  uniqueTags,
  currentPage,
  totalPages,
  activeTag,
  activeQuery,
  sort,
  total,
}: GalleryClientProps) {
  const { navigateToPage, filterBy, changeSort, searchBy } = useListNavigation({
    basePath: '/gallery',
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

      <section id="gallery-header" className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">

          <Breadcrumb items={[{ label: "แกลเลอรี่" }]} />

          <h1 className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400">
            แกลเลอรี่
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            รวมอัลบั้มรูปภาพจากกิจกรรมและช่วงเวลาต่าง ๆ
          </p>
          <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
            ทั้งหมด {total} รายการ
          </p>
        </div>
      </section>


      <section id="gallery-filter-bar" className="px-4 pb-6">
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


      <section id="gallery-grid" className="pt-8 pb-20 px-4 bg-white/70 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto pt-8">
          {filteredItems.length === 0 ? (
            <EmptyState
              title="ไม่พบอัลบั้ม"
              message="ไม่มีอัลบั้มที่ตรงกับเงื่อนไขการค้นหา"
              icon="fi-sr-picture"
            />
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((album) => (
              <Link
                key={album.id}
                href={`/gallery/${album.id}`}
                className="group block relative rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-md shadow-blue-100/40 dark:shadow-black/20 hover:shadow-lg hover:shadow-blue-200/50 dark:hover:shadow-black/40 hover:-translate-y-1.5 transition-all duration-300 ease-in-out overflow-hidden min-h-[200px]"
                style={{ aspectRatio: '16/10' }}
              >
                <Image
                  src={album.cover}
                  alt={album.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/15 dark:bg-black/30 text-white text-[10px] font-semibold backdrop-blur-md border border-white/25 dark:border-white/15 shadow-lg shadow-black/10 dark:shadow-black/30">
                  <i className="fi fi-sr-picture text-[10px]" />
                  {album.photos.length}
                </div>

                <div className="absolute left-0 right-0 bottom-0 w-full z-20 bg-black/40 backdrop-blur-3xs px-4 py-3 border-t border-white/10">
                  <h3 className="text-sm font-bold text-white mb-1.5 line-clamp-1 group-hover:text-blue-300 transition-colors duration-300">
                    {album.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {album.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/30 backdrop-blur-sm border border-white/20 text-white"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/30 backdrop-blur-sm border border-white/20 text-white">
                      <i className="fi fi-sr-calendar-lines text-[8px]" />
                      {formatShortDate(album.date)}
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
