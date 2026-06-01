"use client";

import { useMemo } from "react";
import { useGame } from "../context";
import { t } from "../lang";
import type { Screen } from "../types";

function dateHash(date: string): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    const char = date.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

interface ScenarioType {
  type: string;
  screen: Screen;
  descKey: string;
}

const SCENARIO_TYPES: ScenarioType[] = [
  { type: "Workflow", screen: "workflow", descKey: "stage3.instruction" },
  { type: "Build", screen: "build", descKey: "stage4.instruction" },
  { type: "Diagnosis", screen: "diagnosis", descKey: "stage5.instruction" },
];

export default function DailyChallenge() {
  const { save, lang, mode, navigate } = useGame();

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const challenge = useMemo(() => {
    const hash = dateHash(today);
    return SCENARIO_TYPES[hash % SCENARIO_TYPES.length];
  }, [today]);

  const isCompleted = save.dailyChallenge.date === today && save.dailyChallenge.completed;

  const handlePlay = () => {
    navigate(challenge.screen);
  };

  return (
    <div className="w-[300px] h-[200px] bg-zinc-900 border border-zinc-700 rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider">
          Daily Challenge
        </p>
        <p className="text-zinc-500 text-[10px]">{today}</p>
      </div>
      {isCompleted ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <p className="text-green-400 text-lg font-bold">Completed ✓</p>
          <div className="flex gap-4 text-sm text-zinc-400">
            <span>Score: {save.dailyChallenge.bestScore}</span>
            <span>Time: {save.dailyChallenge.bestTime}s</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <p className="text-white font-bold text-sm mb-1">{challenge.type}</p>
          <p className="text-zinc-400 text-xs leading-relaxed flex-1">
            {t(challenge.descKey, lang, mode)}
          </p>
          <button
            onClick={handlePlay}
            className="mt-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-bold transition-colors self-center"
          >
            Play Challenge
          </button>
        </div>
      )}
    </div>
  );
}
