"use client";

import { useState } from "react";
import type { RangeOption } from "../types";
import { RANGES, HIGH_SCORE_KEY } from "../constants";

interface Props {
  onSelect: (range: RangeOption) => void;
  onBack: () => void;
}

export default function RangeScreen({ onSelect, onBack }: Props) {
  const [highScores] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    const scores: Record<string, number> = {};
    for (const r of RANGES) {
      const val = localStorage.getItem(`${HIGH_SCORE_KEY}-${r.id}`);
      if (val) scores[r.id] = Number(val);
    }
    return scores;
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center space-y-8 animate-in zoom-in duration-500">
      <h2 className="text-3xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-widest">
        เลือกระดับตัวเลข
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-3xl border-4 border-zinc-100 dark:border-zinc-700 hover:border-fuchsia-500 dark:hover:border-fuchsia-400 transition-all group"
          >
            <p className="text-sm font-black text-zinc-400 group-hover:text-fuchsia-500 transition-colors uppercase">
              RANGE
            </p>
            <p className="text-4xl font-black text-zinc-800 dark:text-zinc-100">
              {r.label}
            </p>
            {highScores[r.id] !== undefined && (
              <p className="text-xs font-bold text-amber-500 mt-2">
                Best: {highScores[r.id]}
              </p>
            )}
          </button>
        ))}
      </div>
      <button
        onClick={onBack}
        className="text-zinc-400 font-bold hover:text-fuchsia-500 transition-colors"
      >
        ย้อนกลับ
      </button>
    </div>
  );
}
