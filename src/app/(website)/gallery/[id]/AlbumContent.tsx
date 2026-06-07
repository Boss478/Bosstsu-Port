'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

const PHOTOS_PER_PAGE = 12;
import { type GalleryAlbum } from '../data';
import { formatLongDate } from '@/lib/format';
import dynamic from 'next/dynamic';
const PhotoLightbox = dynamic(() => import('@/components/PhotoLightbox'));
import Breadcrumb from '@/components/Breadcrumb';

interface AlbumContentProps {
  album: GalleryAlbum;
}

export default function AlbumContent({ album }: AlbumContentProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PHOTOS_PER_PAGE);
  const hasMore = visibleCount < album.photos.length;
  const isLoadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingRef.current) {
          isLoadingRef.current = true;
          setVisibleCount((prev) => prev + PHOTOS_PER_PAGE);
        }
      },
      { rootMargin: '200px' },
    );
    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  useEffect(() => {
    isLoadingRef.current = false;
  });

  const handleLoadMore = () => {
    if (!isLoadingRef.current) {
      isLoadingRef.current = true;
      setVisibleCount((prev) => prev + PHOTOS_PER_PAGE);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950">
      <section className="pt-28 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={[{ label: 'แกลเลอรี่', href: '/gallery' }, { label: album.title }]} />

          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-3 leading-relaxed">
            {album.title}
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 mb-4 max-w-2xl">{album.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <i aria-hidden="true" className="fi fi-sr-calendar text-xs" />
              {formatLongDate(album.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <i aria-hidden="true" className="fi fi-sr-picture text-xs" />
              {album.photos.length} รูป
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {album.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
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
              <i aria-hidden="true" className="fi fi-sr-briefcase text-blue-500"></i>
              ดูรายละเอียดโครงการ
              <i
                aria-hidden="true"
                className="fi fi-sr-arrow-right text-xs opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
              ></i>
            </Link>
          )}
        </div>
      </section>

      <section id="album-photos" className="pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {album.photos.slice(0, visibleCount).map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="relative h-60 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-zoom-in group skeleton"
              >
                <Image
                  src={photo}
                  alt={`${album.title} ${idx + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover group-hover:brightness-90 transition-all duration-300"
                />
              </button>
            ))}
          </div>

          <div ref={sentinelRef} className="h-4" />

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                className="px-8 py-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700 shadow-sm hover:shadow-md transition-all text-zinc-700 dark:text-zinc-200 font-medium"
              >
                ดูเพิ่มเติม ({visibleCount}/{album.photos.length})
              </button>
            </div>
          )}
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
