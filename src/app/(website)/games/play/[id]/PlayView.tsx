'use client';

import { useRef } from 'react';
import Link from 'next/link';

interface PlayViewProps {
  htmlContent: string;
  title: string;
}

export default function PlayView({ htmlContent, title }: PlayViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        // Ignore fullscreen errors (e.g. user denied)
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50 z-10">
        <Link
          href="/games"
          className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          <i aria-hidden="true" className="fi fi-sr-angle-left" />
          กลับสู่หน้าเกม
        </Link>

        <h1 className="text-sm font-bold text-white truncate max-w-[50vw] text-center">
          {title}
        </h1>

        <button
          onClick={handleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors border border-slate-700/50"
          title="Full Screen"
        >
          <i aria-hidden="true" className="fi fi-sr-expand" />
          <span className="hidden sm:inline">เต็มจอ</span>
        </button>
      </header>

      {/* Iframe Container */}
      <div ref={containerRef} className="flex-1 min-h-0">
        <iframe
          srcDoc={htmlContent}
          sandbox="allow-scripts"
          className="w-full h-full border-0"
          title={title}
        />
      </div>
    </div>
  );
}
