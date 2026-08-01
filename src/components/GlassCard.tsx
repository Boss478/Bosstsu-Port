'use client';

const VARIANT_STYLES = {
  card: 'p-6',
  compact: 'p-4',
  'empty-state': 'p-8 text-center',
} as const;

export type GlassCardVariant = keyof typeof VARIANT_STYLES;

export default function GlassCard({
  children,
  className = '',
  variant = 'card',
  hover = false,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: GlassCardVariant;
  hover?: boolean;
  as?: 'div' | 'button' | 'section' | 'article';
}) {
  return (
    <Tag
      className={`rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm dark:shadow-black/20 transition-colors duration-500 ${
        VARIANT_STYLES[variant]
      } ${
        hover
          ? `hover:bg-white/80 dark:hover:bg-slate-700/80 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/40 transition-[background-color,border-color,transform,box-shadow] duration-200 ease-spring${Tag !== 'div' ? ' active:scale-[0.98] active:shadow-lg active:duration-150' : ''}`
          : ''
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
