"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
const PhotoLightbox = dynamic(() => import("@/components/PhotoLightbox"));

const IMAGES_PER_PAGE = 30;

interface PortfolioGalleryProps {
  images: string[];
}

export default function PortfolioGallery({ images }: PortfolioGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(IMAGES_PER_PAGE);
  const hasMore = visibleCount < images.length;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.slice(0, visibleCount).map((img, idx) => (
          <button
            key={idx}
            onClick={() => setLightboxIndex(idx)}
            className="relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.03] transition-all duration-300 cursor-zoom-in group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={`Gallery ${idx + 1}`}
              className="absolute inset-0 w-full h-full object-cover group-hover:brightness-90 transition-all duration-300"
            />
          </button>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount(prev => prev + IMAGES_PER_PAGE)}
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
