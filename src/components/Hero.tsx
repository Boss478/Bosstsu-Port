'use client';

import { useId, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CONFIG } from '@/lib/config';

const floatingDots = [
  { left: '8%', w: 6, h: 6, delay: '0s', duration: 22 },
  { left: '22%', w: 4, h: 4, delay: '3s', duration: 28 },
  { left: '38%', w: 8, h: 8, delay: '6s', duration: 20 },
  { left: '52%', w: 5, h: 5, delay: '1s', duration: 25 },
  { left: '68%', w: 3, h: 3, delay: '9s', duration: 30 },
  { left: '80%', w: 7, h: 7, delay: '4s', duration: 22 },
  { left: '15%', w: 5, h: 5, delay: '12s', duration: 26 },
  { left: '90%', w: 4, h: 4, delay: '7s', duration: 24 },
];

const greetings = ["Hello, I'm Boss!", "Hi, I'm Boss!"];

export default function HeroSection() {
  const id = useId();
  const greeting = greetings[id.charCodeAt(id.length - 1) % greetings.length];
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = sectionRef.current;
    if (!el) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const maxScroll = window.innerHeight * 0.8;
          const progress = Math.min(window.scrollY / maxScroll, 1);
          el.style.setProperty('--parallax', String(progress));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLDivElement>}
      id="hero-banner"
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-blue-50 dark:bg-slate-950 pb-6 md:pb-10"
    >
      <div className="absolute inset-0 bg-blue-100/50 dark:bg-slate-950" />

      {floatingDots.map((dot, i) => {
        const factor = 5 + i * 8;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: dot.left,
              width: dot.w,
              height: dot.h,
              transform: `translateY(calc(var(--parallax, 0) * ${factor}px))`,
            }}
          >
            <div
              className="w-full h-full rounded-full bg-blue-400/10 dark:bg-blue-300/5 animate-float-up"
              style={{
                animationDelay: dot.delay,
                animationDuration: `${dot.duration}s`,
              }}
            />
          </div>
        );
      })}

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="mb-8 animate-gentle-bounce">
          <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/30 dark:shadow-blue-600/30">
            <Image
              src="/icon/icon.png"
              alt={`${CONFIG.SITE.NAME} Logo`}
              fill
              sizes="128px"
              priority
              className="object-cover"
            />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-4 animate-fade-slide-up">
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
            {greeting}
          </span>
        </h1>

        <p
          className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-300 mb-8 max-w-2xl mx-auto animate-fade-slide-up"
          style={{ animationDelay: '200ms' }}
        >
          เว็บไซต์สำหรับเก็บความทรงจำของบอสสึ
          <br />
          <span className="text-lg text-zinc-500 dark:text-zinc-400">
            มีทั้งผลงานต่าง ๆ รูปภาพ และสื่อการเรียนรู้ รวมถึงความทรงจำด้วย
          </span>
        </p>

        <div
          id="hero-cta"
          className="flex flex-wrap gap-4 justify-center animate-fade-slide-up"
          style={{ animationDelay: '400ms' }}
        >
          <Link
            href="/portfolio"
            className="px-8 py-4 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white font-semibold text-lg hover:bg-blue-600 dark:hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1"
          >
            ผลงาน
          </Link>
          <Link
            href="/resources"
            className="px-8 py-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs text-zinc-900 dark:text-zinc-100 font-semibold text-lg border border-blue-200 dark:border-slate-700/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            สื่อการเรียนรู้
          </Link>
          <Link
            href="/games"
            className="px-8 py-4 rounded-2xl bg-emerald-500 dark:bg-emerald-600 text-white font-semibold text-lg hover:bg-emerald-600 dark:hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-1"
          >
            เกม
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="animate-gentle-bounce text-blue-400 dark:text-blue-500">
          <i aria-hidden="true" className="fi fi-sr-angle-small-down text-2xl" />
        </div>
      </div>
    </section>
  );
}
