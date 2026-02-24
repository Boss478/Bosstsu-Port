'use client';

interface SaveProgressProps {
  isOpen: boolean;
  progress: number;
  statusText: string;
}

export default function SaveProgress({ isOpen, progress, statusText }: SaveProgressProps) {
  if (!isOpen) return null;

  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(Math.round(progress), 0), 100);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-white/20 dark:border-slate-800 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Loading Icon */}
        <div className="mb-6 flex justify-center">
          {clampedProgress === 100 ? (
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center">
              <i className="fi fi-sr-check-circle text-3xl" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-sky-100 dark:bg-sky-900/30 text-sky-500 rounded-full flex items-center justify-center">
              <i className="fi fi-sr-spinner-third animate-spin text-3xl" />
            </div>
          )}
        </div>

        {/* Text Details */}
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          {clampedProgress === 100 ? 'เสร็จสิ้น!' : 'กำลังบันทึก...'}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 h-5">
          {statusText}
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-zinc-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-zinc-200 dark:border-slate-700 relative">
          <div
            className="h-full bg-linear-to-r from-sky-400 to-sky-600 transition-all duration-300 ease-out flex items-center justify-end"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>

        {/* Percentage Label */}
        <div className="mt-3 flex justify-between items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span>0%</span>
          <span className="text-sky-600 dark:text-sky-400 text-base">{clampedProgress}%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
