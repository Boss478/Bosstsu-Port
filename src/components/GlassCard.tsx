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
      className={`rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm ${
        VARIANT_STYLES[variant]
      } ${
        hover
          ? 'hover:bg-white/80 dark:hover:bg-slate-700/80 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200'
          : ''
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
