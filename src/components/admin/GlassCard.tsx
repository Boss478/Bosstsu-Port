/**
 * Glassmorphism card container component.
 * Consistent styling for form sections and content cards.
 */

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function GlassCard({ children, title, className = '' }: GlassCardProps) {
  return (
    <div 
      className={`p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4 ${className}`}
    >
      {title && (
        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
