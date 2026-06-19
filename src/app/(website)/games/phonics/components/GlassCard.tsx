export default function GlassCard({
  children,
  className = '',
  hover = false,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  as?: 'div' | 'button' | 'section';
}) {
  return (
    <Tag
      className={`rounded-3xl glass-panel transition-all duration-300 ${
        hover ? 'hover:bg-white/70 dark:hover:bg-slate-900/60 hover:-translate-y-1 hover:shadow-lg hover:border-white/80 dark:hover:border-white/20' : ''
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

