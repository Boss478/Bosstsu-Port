'use client';

import { type Toast, type ToastType } from '@/hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

const ICONS: Record<ToastType, string> = {
  success: 'fi fi-sr-check-circle',
  error: 'fi fi-sr-exclamation',
  info: 'fi fi-sr-info',
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-200',
  error: 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-700/50 text-red-800 dark:text-red-200',
  info: 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700/50 text-blue-800 dark:text-blue-200',
};

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm min-w-[200px] max-w-sm animate-slide-up-modal ${STYLES[toast.type]}`}
          role="alert"
        >
          <i aria-hidden="true" className={`${ICONS[toast.type]} text-sm shrink-0`} />
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button
            onClick={() => onDismiss(Number(toast.id))}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <i aria-hidden="true" className="fi fi-sr-cross text-xs" />
          </button>
        </div>
      ))}
    </div>
  );
}
