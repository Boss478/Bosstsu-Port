"use client";

import { useState } from "react";

interface GalleryGridProps {
  images: string[];
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const closeLightbox = () => setActiveIndex(null);

  const showPreviousImage = () => {
    if (activeIndex === null) return;
    setActiveIndex(activeIndex === 0 ? images.length - 1 : activeIndex - 1);
  };

  const showNextImage = () => {
    if (activeIndex === null) return;
    setActiveIndex(activeIndex === images.length - 1 ? 0 : activeIndex + 1);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
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

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            aria-label="Close"
          >
            <i className="fi fi-sr-cross text-lg" />
          </button>

          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                showPreviousImage();
              }}
              className="absolute left-4 md:left-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
              aria-label="Previous image"
            >
              <i className="fi fi-sr-angle-left text-xl" />
            </button>
          )}

          <div
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeIndex]}
              alt={`Gallery ${activeIndex + 1}`}
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            />
          </div>

          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                showNextImage();
              }}
              className="absolute right-4 md:right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
              aria-label="Next image"
            >
              <i className="fi fi-sr-angle-right text-xl" />
            </button>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-black/40 px-4 py-1.5 rounded-full">
            {activeIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
