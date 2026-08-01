'use client';

import type { ButtonHTMLAttributes, Ref } from 'react';

type Variant = 'violet' | 'rose' | 'emerald' | 'fuchsia' | 'white';

const VARIANTS: Record<Variant, string> = {
  violet: 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_8px_0_0_#5b21b6]',
  rose: 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_8px_0_0_#be123c]',
  emerald: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_8px_0_0_#15803d]',
  fuchsia: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-[0_8px_0_0_#9d174d]',
  white:
    'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 shadow-[0_8px_0_0_#e4e4e7] dark:shadow-[0_8px_0_0_#27272a] hover:bg-violet-50 dark:hover:bg-violet-900/20',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: Variant;
  ref?: Ref<HTMLButtonElement>;
}

export default function ChunkyButton({ variant, className = '', children, ...rest }: Props) {
  return (
    <button
      className={`font-black active:shadow-none active:translate-y-2 transition-all ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
