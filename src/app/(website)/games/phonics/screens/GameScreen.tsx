"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "../context";
import { PHONEMES, GAME_CONFIG, COMPANIONS } from "../constants";
import type { PhonicsQuestion, PhonicsFormat } from "../types";
import { WORDS } from "../words";
import { useAudio } from "@/hooks/useAudio";

// ── Question Generator ─────────────────────────────────────────────────────────
function generatePhonicsQuestions(
  format: PhonicsFormat,
  length: number
): PhonicsQuestion[] {
  // Filter words that have at least one phoneme we know
  const pool = WORDS.filter((w) => w.phonemes.some((p) => PHONEMES.find((ph) => ph.id === p)));
  const questions: PhonicsQuestion[] = [];
  const used = new Set<string>();

  for (let i = 0; i < length; i++) {
    // Pick a random phoneme
    const phoneme = PHONEMES[Math.floor(Math.random() * PHONEMES.length)];
    // Pick a word that contains this phoneme
    const matching = pool.filter((w) => w.phonemes.includes(phoneme.id) && !used.has(w.word));
    const word = matching.length > 0
      ? matching[Math.floor(Math.random() * matching.length)]
      : pool[Math.floor(Math.random() * pool.length)];
    if (!word) continue;
    used.add(word.word);

    // Distractors: 3 words that do NOT contain this phoneme
    const distractors = pool
      .filter((w) => !w.phonemes.includes(phoneme.id) && w.word !== word.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [word.word, ...distractors.map((d) => d.word)].sort(() => Math.random() - 0.5);

    questions.push({
      category: "phonics",
      format,
      phoneme,
      word,
      correctAnswer: word.word,
      options,
    });
  }
  return questions;
}

// ── HUD ────────────────────────────────────────────────────────────────────────
function HUD({ current, total, score, streak, muted, onToggleMute, onSettings }: {
  current: number; total: number; score: number; streak: number;
  muted: boolean; onToggleMute: () => void; onSettings: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 retro-border bg-[#FDFBF7] dark:bg-[#101F42]">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-[#888888] dark:text-[#B0C4DE] tracking-widest">
          {current + 1} / {total}
        </span>
        <span className="text-sm font-bold text-[#C8A44E]">⭐ {score}</span>
        {streak >= 3 && (
          <span className="text-xs font-bold text-[#FFBA08]">🔥 ×{streak}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          id="game-mute-btn"
          className="retro-border px-2 py-1 text-xs bg-[#FDFBF7] dark:bg-[#101F42] text-[#1C1C1C] dark:text-[#F7E1A0]"
          onClick={onToggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <button
          id="game-settings-btn"
          className="retro-border px-2 py-1 text-xs bg-[#FDFBF7] dark:bg-[#101F42] text-[#1C1C1C] dark:text-[#F7E1A0]"
          onClick={onSettings}
        >
          ⚙
        </button>
      </div>
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="h-2 bg-[#888888]/20 retro-border" role="progressbar" aria-valuenow={current} aria-valuemax={total}>
      <div
        className="h-full bg-[#2EC4B6] transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Companion hint ─────────────────────────────────────────────────────────────
function CompanionHint({ hint, companion }: { hint: string; companion: string }) {
  const data = COMPANIONS[companion];
  return (
    <div className="animate-hint-slide-up flex items-start gap-3 retro-border bg-[#FDFBF7] dark:bg-[#101F42] p-3">
      <div
        className="shrink-0 w-8 h-8 retro-border flex items-center justify-center text-xs font-bold"
        style={{ background: data?.color + "33", color: data?.color }}
      >
        {data?.name[0] ?? "?"}
      </div>
      <p className="text-xs text-[#1C1C1C] dark:text-[#F7E1A0]">{hint}</p>
    </div>
  );
}

// ── Tap / PickWord format ──────────────────────────────────────────────────────
function TapQuestion({
  question, onAnswer, feedback, speak,
}: {
  question: PhonicsQuestion;
  onAnswer: (a: string) => void;
  feedback: "correct" | "wrong" | null;
  speak: (text: string) => void;
}) {
  const [hintLevel, setHintLevel] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const companion = useGame().companion;

  function handleAnswer(opt: string) {
    if (feedback) return; // lockout during feedback
    onAnswer(opt);
    if (opt !== question.correctAnswer) {
      setWrongAttempts((n) => n + 1);
      if (wrongAttempts + 1 >= 2) setHintLevel((l) => Math.min(l + 1, 3));
    }
  }

  const displayHint = hintLevel > 0
    ? COMPANIONS[companion]?.hints?.phonics?.[hintLevel] ?? null
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Phoneme display */}
      <div className="retro-border bg-[#FDFBF7] dark:bg-[#101F42] p-6 text-center">
        <div
          className="text-6xl font-bold text-[#1C1C1C] dark:text-[#F7E1A0] tracking-widest"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {question.phoneme.ipa}
        </div>
        <p className="text-xs text-[#888888] dark:text-[#B0C4DE] mt-2">{question.phoneme.name}</p>
        <button
          id="phoneme-speak-btn"
          className="mt-3 retro-border px-4 py-1 text-xs font-bold bg-[#C8A44E] text-[#1C1C1C] hover:opacity-90 active:scale-95"
          onClick={() => speak(question.phoneme.ttsText)}
        >
          🔊 HEAR IT
        </button>
      </div>

      <p className="text-center text-xs text-[#888888] dark:text-[#B0C4DE] tracking-widest">
        WHICH WORD STARTS WITH THIS SOUND?
      </p>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((opt) => {
          const isCorrect = opt === question.correctAnswer;
          let btnClass = "retro-border p-4 font-bold text-sm tracking-wide text-center transition-transform active:scale-95 ";
          if (feedback === "correct" && isCorrect) btnClass += "bg-[#2EC4B6] text-[#1C1C1C] animate-correct-bounce";
          else if (feedback === "wrong" && isCorrect) btnClass += "bg-[#2EC4B6]/40 text-[#1C1C1C] dark:text-white";
          else if (feedback === "wrong" && !isCorrect) btnClass += "bg-[#FF70A6]/40 text-[#1C1C1C] dark:text-white animate-wrong-shake";
          else btnClass += "bg-[#FDFBF7] dark:bg-[#101F42] text-[#1C1C1C] dark:text-[#F7E1A0] hover:bg-[#C8A44E]/20";
          return (
            <button
              key={opt}
              id={`option-${opt}`}
              className={btnClass}
              onClick={() => handleAnswer(opt)}
              disabled={!!feedback}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      {displayHint && <CompanionHint hint={displayHint} companion={companion} />}
    </div>
  );
}

// ── Main GameScreen ────────────────────────────────────────────────────────────
interface GameScreenProps {
  onRoundComplete: () => void;
}

export default function GameScreen({ onRoundComplete }: GameScreenProps) {
  const { round, setScreen, answerQuestion, muted, toggleMute } = useGame();
  const { speak } = useAudio();
  const [localRound] = useState(() => {
    if (round && round.questions.length === 0) {
      const config = round.config;
      const format = config.phonicsFormat ?? "tap";
      const questions = generatePhonicsQuestions(format, config.length);
      round.questions.push(...questions);
      return { ...round, questions };
    }
    return round;
  });
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundCompleted = useRef(false);

  const questions = localRound?.questions ?? round?.questions ?? [];
  const currentIndex = round?.currentIndex ?? 0;
  const question = questions[currentIndex] as PhonicsQuestion | undefined;

  // Detect end of round
  useEffect(() => {
    if (!round || roundCompleted.current) return;
    if (round.currentIndex >= questions.length && questions.length > 0) {
      roundCompleted.current = true;
      onRoundComplete();
    }
  }, [round, questions.length, onRoundComplete]);

  function handleAnswer(answer: string) {
    if (feedback) return;
    const correct = answer.toLowerCase() === (question?.correctAnswer ?? "").toLowerCase();
    setFeedback(correct ? "correct" : "wrong");
    answerQuestion(answer);
    feedbackTimer.current = setTimeout(() => {
      setFeedback(null);
    }, GAME_CONFIG.FEEDBACK_DURATION_MS);
  }

  if (!round || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#A2D2FF] dark:bg-[#0A1128]">
        <p className="text-[#1C1C1C] dark:text-[#F7E1A0] tracking-widest">LOADING...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#A2D2FF] dark:bg-[#0A1128]">
      <HUD
        current={currentIndex}
        total={questions.length}
        score={round.score}
        streak={round.streak}
        muted={muted}
        onToggleMute={toggleMute}
        onSettings={() => setScreen("settings")}
      />
      <ProgressBar current={currentIndex} total={questions.length} />

      <div className="flex-1 flex flex-col justify-center px-4 py-6 max-w-lg mx-auto w-full">
        {question.format === "tap" || question.format === "pick-word" || question.format === "speed" ? (
          <TapQuestion
            question={question}
            onAnswer={handleAnswer}
            feedback={feedback}
            speak={speak}
          />
        ) : (
          // card-flip falls back to tap for MVP
          <TapQuestion
            question={question}
            onAnswer={handleAnswer}
            feedback={feedback}
            speak={speak}
          />
        )}
      </div>
    </div>
  );
}
