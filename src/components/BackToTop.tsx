"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    let rafId = 0;
    const handleScrollVisibility = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setShowButton(window.scrollY > 200);
      });
    };

    window.addEventListener("scroll", handleScrollVisibility);
    return () => {
      window.removeEventListener("scroll", handleScrollVisibility);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollToPageTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {showButton && (
        <button
          onClick={scrollToPageTop}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 p-3 rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs border border-white/60 text-sky-600 dark:text-sky-400 shadow-lg shadow-sky-100/40 dark:shadow-black/20 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 animate-fade-in-up"
          aria-label="Back to top"
        >
          <i className="fi fi-sr-arrow-small-up text-xl leading-none flex items-center justify-center"></i>
        </button>
      )}
    </>
  );
}
