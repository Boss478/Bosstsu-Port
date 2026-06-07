'use client';

import { useEffect, useState, useRef } from 'react';

interface StatsBarProps {
  portfolioCount: number;
  galleryCount: number;
  gameCount: number;
  resourceCount: number;
}

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
}

export default function StatsBar({
  portfolioCount,
  galleryCount,
  gameCount,
  resourceCount,
}: StatsBarProps) {
  const counts: [number, number, number, number] = [
    portfolioCount,
    galleryCount,
    gameCount,
    resourceCount,
  ];
  const [display, setDisplay] = useState(counts);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const duration = 1200;
    const from: [number, number, number, number] = [0, 0, 0, 0];

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(from.map((f, i) => Math.round(f + (counts[i] - f) * ease)) as typeof counts);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, counts]);

  const stats: StatCard[] = [
    {
      label: 'ผลงาน',
      value: display[0],
      icon: 'fi fi-sr-briefcase',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'รูปภาพ',
      value: display[1],
      icon: 'fi fi-sr-picture',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'เกม',
      value: display[2],
      icon: 'fi fi-sr-gamepad',
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'สื่อการเรียนรู้',
      value: display[3],
      icon: 'fi fi-sr-book-alt',
      color: 'text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <section ref={ref} className="py-12 px-4 bg-blue-50/50 dark:bg-slate-950/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative p-5 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/60 dark:border-white/10 shadow-sm flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute -top-4 -right-4 text-6xl opacity-5 dark:opacity-[0.03]">
                <i aria-hidden="true" className={stat.icon} />
              </div>
              <i
                aria-hidden="true"
                className={`${stat.icon} text-xl md:text-2xl ${stat.color} mb-2`}
              />
              <span className="text-3xl md:text-4xl font-bold text-zinc-800 dark:text-zinc-100 tabular-nums">
                {stat.value.toLocaleString()}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
