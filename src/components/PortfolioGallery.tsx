'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
const PhotoLightbox = dynamic(() => import('@/components/PhotoLightbox'));

const IMAGES_PER_PAGE = 12;

interface PortfolioGalleryProps {
  images: string[];
}

export default function PortfolioGallery({ images }: PortfolioGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(IMAGES_PER_PAGE);
  const hasMore = visibleCount < images.length;
  const isLoadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingRef.current) {
          isLoadingRef.current = true;
          setVisibleCount((prev) => prev + IMAGES_PER_PAGE);
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
      setVisibleCount((prev) => prev + IMAGES_PER_PAGE);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.slice(0, visibleCount).map((img, idx) => (
          <button
            key={idx}
            onClick={() => setLightboxIndex(idx)}
            className="relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.03] transition-all duration-300 cursor-zoom-in group skeleton"
          >
            <Image
              src={img}
              alt={`Gallery ${idx + 1}`}
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
            ดูเพิ่มเติม ({visibleCount}/{images.length})
          </button>
        </div>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
