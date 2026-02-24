"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate, type GalleryAlbum } from "../data";
import PhotoLightbox from "@/components/PhotoLightbox";
import Breadcrumb from "@/components/Breadcrumb";

interface AlbumContentProps {
  album: GalleryAlbum;
}

export default function AlbumContent({ album }: AlbumContentProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);


  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950">

      <section className="pt-28 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb
            items={[
              { label: "แกลเลอรี่", href: "/gallery" },
              { label: album.title },
            ]}
          />

          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            {album.title}
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 mb-4 max-w-2xl">
            {album.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <i className="fi fi-sr-calendar text-xs" />
              {formatDate(album.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="fi fi-sr-picture text-xs" />
              {album.photos.length} รูป
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {album.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300"
              >
                {tag}
              </span>
            ))}
          </div>

          {album.relatedPortfolioId && (
            <Link
              href={`/portfolio/${album.relatedPortfolioId}`}
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all duration-300 text-zinc-700 dark:text-zinc-200 font-medium text-sm group"
            >
              <i className="fi fi-sr-briefcase text-sky-500"></i>
              ดูรายละเอียดโครงการ
              <i className="fi fi-sr-arrow-right text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"></i>
            </Link>
          )}
        </div>
      </section>


      <section id="album-photos" className="pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {album.photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="relative h-60 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-zoom-in group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`${album.title} ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover group-hover:brightness-90 transition-all duration-300"
                />
              </button>
            ))}
          </div>
        </div>
      </section>


      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={album.photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
