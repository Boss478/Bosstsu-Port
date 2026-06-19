"use client";

import { useState } from "react";
import MascotCanvas from "../components/MascotCanvas";

interface TutorialScreenProps {
  onComplete: () => void;
  onStartPractice?: () => void;
}

const STEPS = [
  {
    title: "WELCOME TO PHONICS ISLAND!",
    body: "Follow the path of lessons from A1 to C1. Each lesson teaches you new sounds. Tap a lesson node on the path to begin your journey.",
    mascotAnim: "idle" as const,
    tip: "Start by tapping a lesson on the path map",
  },
  {
    title: "ANSWER QUESTIONS",
    body: "Hear a sound (phoneme), then tap the correct word. Spell words with tiles or choices. Match definitions to words to build vocabulary.",
    mascotAnim: "celebrate" as const,
    tip: "Your companion will guide you through each question",
  },
  {
    title: "READY TO PRACTICE?",
    body: "Try 3 sample questions to see how it works. You'll hear a phoneme and pick the matching word. Your companion will cheer you on!",
    mascotAnim: "think" as const,
    tip: "No pressure — this is just a warm-up!",
  },
];

export default function TutorialScreen({ onComplete, onStartPractice }: TutorialScreenProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleAdvance = () => {
    if (!isLast) setStep((s) => s + 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 cursor-pointer"
      onClick={handleAdvance}
    >
      <div
        className="glass-heavy border border-white/60 dark:border-slate-700/50 rounded-3xl w-full max-w-md p-8 text-center shadow-2xl relative overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step indicator dots */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? "bg-[#C8A44E] w-4"
                  : i < step
                  ? "bg-[#2EC4B6]"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>

        {/* Mascot */}
        <div className="mt-8 mb-4 flex justify-center">
          <div className="relative">
            <MascotCanvas
              companionId="nox"
              size={72}
              animationState={current.mascotAnim}
              className="rounded-2xl bg-white/20 p-2 border border-white/30"
            />
            <div className="absolute -top-2 -right-2 bg-[#2EC4B6] text-white text-[10px] font-bold px-2 py-1 rounded-xl whitespace-nowrap shadow-md">
              {isLast ? "Let's go!" : "Tap!"}
            </div>
          </div>
        </div>

        <h2
          className="font-bold text-xl text-[#1C1C1C] dark:text-[#F7E1A0] tracking-widest mb-3"
          style={{ fontFamily: "var(--font-mali)" }}
        >
          {current.title}
        </h2>

        <p className="text-sm text-[#1C1C1C]/70 dark:text-[#F7E1A0]/80 mb-4 leading-relaxed">
          {current.body}
        </p>

        {/* Tip highlight */}
        <div className="bg-[#C8A44E]/10 border border-[#C8A44E]/30 rounded-xl px-3 py-2 mb-6 inline-flex items-center gap-1.5">
          <i className="fi fi-sr-bulb text-[#C8A44E] text-xs" />
          <span className="text-xs font-bold text-[#C8A44E]">{current.tip}</span>
        </div>

        <div className="flex gap-3 justify-center items-center">
          {isLast ? (
            <>
              {onStartPractice && (
                <button
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2EC4B6] to-[#C8A44E] text-white font-bold text-sm tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartPractice();
                  }}
                >
                  <i className="fi fi-sr-play mr-1.5" />
                  TRY 3 QUESTIONS
                </button>
              )}
              <button
                id="tutorial-start"
                className="px-5 py-2.5 rounded-xl bg-slate-400/50 dark:bg-slate-700/50 text-white font-bold text-sm tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
              >
                SKIP TO PATH
              </button>
            </>
          ) : (
            <button
              id="tutorial-next"
              className="px-6 py-2.5 rounded-xl bg-[#C8A44E] text-white font-bold text-sm tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleAdvance();
              }}
            >
              NEXT
            </button>
          )}
        </div>

        {!isLast && (
          <p className="text-[10px] text-[#1C1C1C]/40 dark:text-[#F7E1A0]/40 mt-4">
            Tap anywhere or press NEXT
          </p>
        )}
      </div>
    </div>
  );
}
