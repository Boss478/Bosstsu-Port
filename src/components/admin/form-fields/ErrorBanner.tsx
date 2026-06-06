'use client';

interface ErrorBannerProps {
  message: string;
  visible: boolean;
}

export default function ErrorBanner({ message, visible }: ErrorBannerProps) {
  if (!visible) return null;

  return (
    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50 text-sm flex items-start gap-3">
      <i aria-hidden="true" className="fi fi-sr-exclamation mt-0.5 flex shrink-0" />
      <span>{message}</span>
    </div>
  );
}
