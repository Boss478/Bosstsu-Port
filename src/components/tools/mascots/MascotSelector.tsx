'use client';

import { ALL_MASCOTS } from './mascot-data';
import MascotAvatar from './MascotAvatar';

interface MascotSelectorProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function MascotSelector({ selectedId, onSelect }: MascotSelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
        เลือกมาสคอตของคุณ <span className="text-xs text-zinc-400">(Choose your mascot)</span>
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 max-w-xs mx-auto">
        {ALL_MASCOTS.map((m) => {
          const isSelected = selectedId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              aria-label={`Select ${m.name} mascot`}
              className={`
                flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer
                ${isSelected
                  ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500 scale-105'
                  : 'bg-white/40 dark:bg-slate-800/40 hover:bg-zinc-100 dark:hover:bg-slate-700/50 hover:scale-105'
                }
              `}
            >
              <MascotAvatar mascotId={m.id} size={64} variant="head" />
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                {m.nameTh}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
