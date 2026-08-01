'use client';

interface StepIndicatorProps {
  total: number;
  currentStep: number;
  lastActiveStep?: number;
  interactive?: boolean;
  onStepClick?: (index: number) => void;
  advancing?: boolean;
  actions?: React.ReactNode;
  stepLabels?: string[];
}

export default function StepIndicator({
  total,
  currentStep,
  lastActiveStep = currentStep,
  interactive = false,
  onStepClick,
  advancing = false,
  actions,
  stepLabels,
}: StepIndicatorProps) {
  const effective = currentStep === -1 ? lastActiveStep : currentStep;

  if (!interactive) {
    return (
      <div className="flex items-center gap-2 justify-center">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i === currentStep
                ? 'bg-blue-600 scale-125'
                : i < currentStep
                  ? 'bg-blue-300 dark:bg-blue-700'
                  : 'bg-zinc-300 dark:bg-zinc-600'
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Step</h3>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, idx) => {
          let btnClasses: string;
          if (idx === effective) {
            btnClasses =
              currentStep === -1
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-blue-600 text-white shadow-sm';
          } else if (idx < effective) {
            btnClasses =
              currentStep === -1
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
          } else {
            btnClasses = 'bg-zinc-100 dark:bg-slate-700 text-zinc-500 dark:text-zinc-400';
          }
          const lineClasses =
            idx < effective
              ? currentStep === -1
                ? 'bg-amber-400'
                : 'bg-emerald-400'
              : 'bg-zinc-300 dark:bg-slate-600';
          return (
            <div key={idx} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => onStepClick?.(idx)}
                disabled={advancing}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${btnClasses}`}
              >
                <span className="block font-bold">{idx + 1}</span>
                <span className="block truncate">{stepLabels?.[idx]}</span>
              </button>
              {idx < total - 1 && <div className={`w-4 h-0.5 ${lineClasses}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
