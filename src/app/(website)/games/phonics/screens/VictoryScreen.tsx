"use client";

import { useEffect, useRef } from "react";
import { useGame } from "../context";
import type { GameRound } from "../types";

interface VictoryScreenProps {
  round: GameRound;
  onPlayAgain: () => void;
  onBackToMap: () => void;
}

function StarRating({ corrects, total }: { corrects: number; total: number }) {
  const pct = total > 0 ? corrects / total : 0;
  const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
  return (
    <div className="flex gap-2 justify-center" aria-label={`${stars} out of 3 stars`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`text-4xl ${n <= stars ? "animate-star-pop" : "opacity-30"}`}
          style={{ animationDelay: `${(n - 1) * 0.15}s`, color: n <= stars ? "#FFBA08" : "#888888" }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function VictoryScreen({ round, onPlayAgain, onBackToMap }: VictoryScreenProps) {
  const { save } = useGame();
  const announced = useRef(false);

  useEffect(() => {
    if (!announced.current) {
      announced.current = true;
    }
  }, []);

  const accuracy = round.results.length > 0
    ? Math.round((round.corrects / round.results.length) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#A2D2FF] dark:bg-[#0A1128]">
      {/* Title */}
      <div className="text-center mb-6">
        <h1
          className="text-5xl font-bold text-[#1C1C1C] dark:text-[#F7E1A0] tracking-widest uppercase"
          style={{ fontFamily: "var(--font-mali)" }}
        >
          WELL DONE!
        </h1>
        <p className="mt-2 text-sm text-[#1C1C1C]/60 dark:text-[#F7E1A0]/50 tracking-wide">ROUND COMPLETE</p>
      </div>

      {/* Stars */}
      <StarRating corrects={round.corrects} total={round.results.length} />

      {/* Stats panel */}
      <div className="retro-border bg-[#FDFBF7] dark:bg-[#101F42] w-full max-w-sm mt-8 p-5 space-y-3">
        <StatRow label="Score" value={`${round.score}`} color="#C8A44E" />
        <StatRow label="Correct" value={`${round.corrects} / ${round.results.length}`} color="#2EC4B6" />
        <StatRow label="Accuracy" value={`${accuracy}%`} color="#2EC4B6" />
        <StatRow label="Best Streak" value={`${round.maxStreak} 🔥`} color="#FFBA08" />
        <StatRow label="Coins Earned" value={`${round.coinsEarned} 🪙`} color="#C8A44E" />
        {save && (
          <StatRow label="Total Coins" value={`${save.phonemeCoins} 🪙`} color="#C8A44E" />
        )}
      </div>

      {/* Question Review */}
      <div className="retro-border bg-[#FDFBF7] dark:bg-[#101F42] w-full max-w-sm mt-4 overflow-hidden">
        <div className="p-3 border-b-2 border-[#1C1C1C] dark:border-[#D4AF37]">
          <p className="text-xs font-bold text-[#1C1C1C] dark:text-[#F7E1A0] tracking-widest">QUESTION REVIEW</p>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {round.results.map((r, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 border-b border-[#1C1C1C]/10 dark:border-[#F7E1A0]/10 ${
                r.correct ? "bg-[#2EC4B6]/10" : "bg-[#FF70A6]/10"
              }`}
            >
              <span className="text-base">{r.correct ? "✓" : "✗"}</span>
              <span className="text-xs text-[#1C1C1C] dark:text-[#F7E1A0] flex-1">
                {r.question.category === "phonics" && r.question.format !== "card-flip"
                  ? `${r.question.phoneme.ipa} → ${r.playerAnswer}`
                  : r.question.category === "spelling"
                  ? `Spell: ${r.question.word.word}`
                  : r.playerAnswer}
              </span>
              {!r.correct && (
                <span className="text-xs text-[#FF70A6] font-bold">
                  {r.question.category === "phonics" ? r.question.correctAnswer
                    : r.question.category === "spelling" ? r.question.word.word
                    : r.question.correctAnswer}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mt-8">
        <button
          id="victory-play-again"
          className="retro-border px-6 py-3 font-bold text-sm tracking-widest bg-[#C8A44E] text-[#1C1C1C] hover:opacity-90 active:scale-95 transition-transform"
          onClick={onPlayAgain}
        >
          PLAY AGAIN
        </button>
        <button
          id="victory-back-to-map"
          className="retro-border px-6 py-3 font-bold text-sm tracking-widest bg-[#FDFBF7] dark:bg-[#101F42] text-[#1C1C1C] dark:text-[#F7E1A0] hover:opacity-90 active:scale-95 transition-transform"
          onClick={onBackToMap}
        >
          MAP
        </button>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#888888] dark:text-[#B0C4DE] tracking-wide">{label}</span>
      <span className="font-bold text-sm" style={{ color }}>{value}</span>
    </div>
  );
}
