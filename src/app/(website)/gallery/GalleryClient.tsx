"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { type GalleryAlbum, formatDate } from "./data";
import Breadcrumb from "@/components/Breadcrumb";

const ITEMS_PER_PAGE = 15;

export default function GalleryClient({ initialAlbums }: { initialAlbums: GalleryAlbum[] }) {
  const [activeTag, setActiveTag] = useState<string>("ทั้งหมด");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const uniqueTags = useMemo(() => {
    const set = new Set<string>();
    initialAlbums.forEach((album) => album.tags.forEach((t) => set.add(t)));
    return ["ทั้งหมด", ...Array.from(set)];
  }, [initialAlbums]);

  const filteredAndSortedAlbums = useMemo(() => {
    const albums =
      activeTag === "ทั้งหมด"
        ? [...initialAlbums]
        : initialAlbums.filter((album) => album.tags.includes(activeTag));

    albums.sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortOrder === "desc" ? -diff : diff;
    });

    return albums;
  }, [activeTag, sortOrder, initialAlbums]);

  const totalPages = Math.ceil(filteredAndSortedAlbums.length / ITEMS_PER_PAGE);
  const pagedAlbums = filteredAndSortedAlbums.slice(
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

      <section id="gallery-header" className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">

          <Breadcrumb items={[{ label: "แกลเลอรี่" }]} />

          <h1 className="text-4xl md:text-5xl font-bold text-sky-600 dark:text-sky-400">
            แกลเลอรี่
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            รวมอัลบั้มรูปภาพจากกิจกรรมและช่วงเวลาต่าง ๆ
          </p>
        </div>
      </section>


      <section id="gallery-filter-bar" className="px-4 pb-6">
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


      <section id="gallery-grid" className="pb-20 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedAlbums.map((album) => (
              <Link
                key={album.id}
                href={`/gallery/${album.id}`}
                className="group block relative rounded-2xl shadow-md shadow-sky-100/40 dark:shadow-black/20 hover:shadow-lg hover:shadow-sky-200/50 dark:hover:shadow-black/40 hover:-translate-y-1.5 transition-all duration-300 ease-in-out overflow-hidden"
                style={{ aspectRatio: '16/10' }}
              >
                {/* Full-size cover image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={album.cover}
                  alt={album.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Photo count badge (top-left) — glassmorphism */}
                <div className="absolute top-3 left-3 mt-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/15 dark:bg-black/30 text-white text-[10px] font-semibold backdrop-blur-md border border-white/25 dark:border-white/15 shadow-lg shadow-black/10 dark:shadow-black/30">
                  <i className="fi fi-sr-picture text-[10px]" />
                  {album.photos.length}
                </div>

                {/* Bottom blur overlay — full width */}
                <div className="absolute left-0 right-0 bottom-0 w-full z-20 bg-black/40 backdrop-blur-3xs px-4 py-3 border-t border-white/10">
                  <h3 className="text-sm font-bold text-white mb-1.5 line-clamp-1 group-hover:text-sky-300 transition-colors duration-300">
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
                      {formatDate(album.date)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>


          {totalPages > 1 && (
            <div id="gallery-pagination" className="flex justify-center items-center gap-2 mt-12">

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
