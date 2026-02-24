"use client";

import { useState, useEffect, useCallback } from "react";
import exifr from "exifr";

interface PhotoLightboxProps {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}

interface ExifData {
  camera?: string;
  lens?: string;
  iso?: string;
  shutter?: string;
  aperture?: string;
  focalLength?: string;
  dateTaken?: string;
}

function formatExifDate(date: Date | string | undefined): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShutter(exposure: number | undefined): string {
  if (!exposure) return "";
  if (exposure >= 1) return `${exposure}s`;
  return `1/${Math.round(1 / exposure)}s`;
}

export default function PhotoLightbox({ photos, initialIndex, onClose }: PhotoLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [showInfo, setShowInfo] = useState(true);
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [exifLoading, setExifLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);

  const showPrevious = useCallback(() => {
    setActiveIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  }, [photos.length]);

  const showNext = useCallback(() => {
    setActiveIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  }, [photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") showPrevious();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "i" || e.key === "I") setShowInfo((v) => !v);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, showPrevious, showNext]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset when active photo changes
    setExifData(null);
    setExifLoading(true);
    setFileInfo(null);

    const url = photos[activeIndex];
    const filename = url.split('/').pop()?.split('?')[0] || "image.jpg";

    // Fetch Content-Length for file size
    fetch(url, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) {
          const size = res.headers.get("content-length");
          if (size) {
            const bytes = parseInt(size, 10);
            const sizeStr = bytes < 1024 * 1024 
              ? `${(bytes / 1024).toFixed(1)} KB` 
              : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
            setFileInfo({ name: filename, size: sizeStr });
          } else {
            setFileInfo({ name: filename, size: "Unknown size" });
          }
        }
      })
      .catch(() => {
        if (!cancelled) setFileInfo({ name: filename, size: "" });
      });

    exifr
      .parse(url, {
        pick: [
          "Make", "Model", "LensModel", "LensMake",
          "ISO", "ExposureTime", "FNumber", "FocalLength",
          "DateTimeOriginal",
        ],
      })
      .then((data) => {
        if (cancelled || !data) {
          setExifData(null);
          setExifLoading(false);
          return;
        }

        const camera = [data.Make, data.Model].filter(Boolean).join(" ") || undefined;
        const lens = data.LensModel || data.LensMake || undefined;

        setExifData({
          camera,
          lens,
          iso: data.ISO ? `ISO ${data.ISO}` : undefined,
          shutter: formatShutter(data.ExposureTime),
          aperture: data.FNumber ? `f/${data.FNumber}` : undefined,
          focalLength: data.FocalLength ? `${data.FocalLength}mm` : undefined,
          dateTaken: formatExifDate(data.DateTimeOriginal),
        });
        setExifLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setExifData(null);
          setExifLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeIndex, photos]);

  const hasExif = exifData && Object.values(exifData).some(Boolean);

  const infoRows: { icon: string; label: string; value: string }[] = [];
  if (exifData?.camera) infoRows.push({ icon: "fi fi-sr-camera", label: "Camera", value: exifData.camera });
  if (exifData?.lens) infoRows.push({ icon: "fi fi-sr-circle", label: "Lens", value: exifData.lens });
  if (exifData?.focalLength) infoRows.push({ icon: "fi fi-sr-search", label: "Focal Length", value: exifData.focalLength });
  if (exifData?.aperture) infoRows.push({ icon: "fi fi-sr-aperture", label: "Aperture", value: exifData.aperture });
  if (exifData?.shutter) infoRows.push({ icon: "fi fi-sr-stopwatch", label: "Shutter", value: exifData.shutter });
  if (exifData?.iso) infoRows.push({ icon: "fi fi-sr-brightness", label: "ISO", value: exifData.iso });
  if (exifData?.dateTaken) infoRows.push({ icon: "fi fi-sr-calendar", label: "Date Taken", value: exifData.dateTaken });

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >

      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowInfo((v) => !v);
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            showInfo
              ? "bg-white/40 text-white backdrop-blur-xs"
              : "bg-black/30 hover:bg-white/20 text-white/80 backdrop-blur-xs"
          }`}
          aria-label="Toggle info"
          title="แสดง/ซ่อนข้อมูลรูป (I)"
        >
          <i className="fi fi-sr-info text-lg" />
        </button>

        <a
          href={photos[activeIndex]}
          download
          onClick={(e) => e.stopPropagation()}
          className="w-10 h-10 rounded-full bg-black/30 hover:bg-white/20 text-white/80 flex items-center justify-center transition-colors backdrop-blur-xs"
          aria-label="Download"
          title="ดาวน์โหลดรูป"
        >
          <i className="fi fi-sr-download text-lg" />
        </a>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/30 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-xs"
          aria-label="Close"
          title="ปิด (Esc)"
        >
          <i className="fi fi-sr-cross text-lg" />
        </button>
      </div>


      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            showPrevious();
          }}
          className="absolute left-2 sm:left-4 md:left-8 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/20 hover:bg-white/20 text-white flex items-center justify-center transition-all duration-200 z-30 backdrop-blur-md border border-white/10"
          aria-label="Previous image"
        >
          <i className="fi fi-sr-angle-left text-lg md:text-xl" />
        </button>
      )}


      <div
        className={`relative inline-flex flex-col items-center justify-center transition-transform duration-300 ease-out ${
          showInfo ? "md:-translate-x-[106px] lg:-translate-x-[126px]" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[activeIndex]}
          alt={`Photo ${activeIndex + 1}`}
          className="max-w-[95vw] md:max-w-[calc(90vw-230px)] lg:max-w-[calc(85vw-260px)] max-h-[60vh] sm:max-h-[70vh] md:max-h-[85vh] rounded-2xl shadow-2xl transition-all duration-300 object-contain"
        />

        {showInfo && (
          <div className="mt-4 md:mt-0 md:absolute md:bottom-0 md:left-full md:ml-3 z-20 flex flex-col gap-1.5 w-[95vw] sm:w-[80vw] md:w-[200px] lg:w-[240px] animate-fade-in-up origin-top md:origin-bottom-left">
            {/* File Info Float */}
            {fileInfo && (
              <div className="w-full bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-2 rounded-xl text-[10px] font-mono shadow-lg flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-2 md:gap-0.5 box-border">
                <span className="font-medium text-white break-all text-left">{fileInfo.name}</span>
                <span className="text-white/50 shrink-0 whitespace-nowrap">{fileInfo.size}</span>
              </div>
            )}

            {/* EXIF Data Float */}
            {hasExif && (
              <div className="w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-xl box-border">
                {exifLoading ? (
                  <p className="text-xs text-white/60">Loading data...</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-x-2 gap-y-2.5">
                    {infoRows.map((row) => (
                      <div key={row.label} className="flex items-start gap-2">
                        <i className={`${row.icon} text-sky-400 text-[10px] mt-0.5 shrink-0`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] text-white/50 uppercase tracking-wider mb-px">{row.label}</p>
                          <p className="text-[10px] sm:text-xs font-medium text-white/90 leading-tight wrap-break-word">{row.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>


      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            showNext();
          }}
          className="absolute right-2 sm:right-4 md:right-8 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/20 hover:bg-white/20 text-white flex items-center justify-center transition-all duration-200 z-30 backdrop-blur-md border border-white/10"
          aria-label="Next image"
        >
          <i className="fi fi-sr-angle-right text-lg md:text-xl" />
        </button>
      )}


      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-black/40 px-4 py-1.5 rounded-full">
        {activeIndex + 1} / {photos.length}
      </div>
    </div>
  );
}
