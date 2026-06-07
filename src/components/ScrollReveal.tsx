'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: string;
  variant?: 'fade-up' | 'fade-left' | 'fade-right' | 'scale-up';
  className?: string;
}

const variantMap: Record<string, string> = {
  'fade-up': 'animate-fade-slide-up',
  'fade-left': 'animate-fade-left',
  'fade-right': 'animate-fade-right',
  'scale-up': 'animate-scale-up',
};

export default function ScrollReveal({
  children,
  delay = '0ms',
  variant = 'fade-up',
  className = '',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.animationDelay = delay;
          el.classList.add(variantMap[variant] || variantMap['fade-up']);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, variant]);

  return (
    <div ref={ref} className={`opacity-0 motion-reduce:opacity-100 ${className}`}>
      {children}
    </div>
  );
}
