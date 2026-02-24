"use client";

import { useState } from "react";
import PhotoLightbox from "@/components/PhotoLightbox";

interface PortfolioGalleryProps {
  images: string[];
}

export default function PortfolioGallery({ images }: PortfolioGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img, idx) => (
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
