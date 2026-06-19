"use client";

import { useEffect, useState } from "react";
import type { CompanionId } from "../types";
import MascotCanvas from "./MascotCanvas";

interface Props {
  hint: string;
  companion: string;
  feedback: "correct" | "wrong" | null;
}

export default function CompanionHint({
  hint,
  companion,
  feedback,
}: Props) {
  const [animState, setAnimState] = useState<"idle" | "celebrate" | "shake">("idle");

  useEffect(() => {
    if (feedback === "correct") {
      const t1 = setTimeout(() => setAnimState("celebrate"), 0);
      const t2 = setTimeout(() => setAnimState("idle"), 600);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    if (feedback === "wrong") {
      const t1 = setTimeout(() => setAnimState("shake"), 0);
      const t2 = setTimeout(() => setAnimState("idle"), 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    const t = setTimeout(() => setAnimState("idle"), 0);
    return () => clearTimeout(t);
  }, [feedback]);

  return (
    <div className="animate-hint-slide-up flex items-start gap-3.5 bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm max-w-sm mx-auto">
      <MascotCanvas
        companionId={companion as CompanionId}
        size={36}
        animationState={animState}
        className="rounded-xl"
      />
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed text-left">
        {hint}
      </p>
    </div>
  );
}
