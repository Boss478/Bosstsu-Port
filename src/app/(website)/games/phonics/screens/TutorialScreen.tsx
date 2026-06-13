"use client";

import { useState } from "react";

interface TutorialScreenProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: "WELCOME TO PHONICS ISLAND!",
    body: "Move your character around the island by clicking on the map or using the arrow keys. Explore different buildings to play!",
  },
  {
    title: "ENTER A BUILDING",
    body: "Walk up to a building to start a game. The Phonics Island teaches you sounds. The Library tests your spelling. The School challenges your word knowledge.",
  },
  {
    title: "ANSWER QUESTIONS",
    body: "Listen to the sound (phoneme), then tap the correct word. Speed rounds have a 3-second timer. Card Flip asks you to match sounds to words from memory.",
  },
];

export default function TutorialScreen({ onComplete }: TutorialScreenProps) {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="retro-border bg-[#FDFBF7] dark:bg-[#101F42] w-full max-w-md p-6 text-center">
        <h2 className="font-bold text-lg text-[#1C1C1C] dark:text-[#F7E1A0] tracking-widest mb-4" style={{ fontFamily: "var(--font-mali)" }}>
          {STEPS[step].title}
        </h2>
        <p className="text-sm text-[#1C1C1C] dark:text-[#F7E1A0] mb-6 leading-relaxed">
          {STEPS[step].body}
        </p>
        <div className="flex gap-3 justify-center">
          {step < STEPS.length - 1 ? (
            <>
              <span className="text-xs text-[#888888] dark:text-[#B0C4DE] self-center">
                {step + 1} / {STEPS.length}
              </span>
              <button
                id="tutorial-next"
                className="retro-border px-6 py-2 font-bold text-sm tracking-widest bg-[#C8A44E] text-[#1C1C1C] hover:opacity-90 active:scale-95"
                onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
              >
                NEXT
              </button>
            </>
          ) : (
            <button
              id="tutorial-start"
              className="retro-border px-6 py-2 font-bold text-sm tracking-widest bg-[#2EC4B6] text-[#1C1C1C] hover:opacity-90 active:scale-95"
              onClick={onComplete}
            >
              LET'S GO!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
