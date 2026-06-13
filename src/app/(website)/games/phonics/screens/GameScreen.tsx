"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "../context";
import { PHONEMES, GAME_CONFIG, COMPANIONS } from "../constants";
import type {
  PhonicsQuestion, SpellingQuestion, DefinitionQuestion,
  PhonicsFormat, SpellingFormat, DefinitionDirection, CardFlipCard,
  Question,
} from "../types";
import { WORDS } from "../words";
import { useAudio } from "@/hooks/useAudio";
import CardFlipGame from "../components/CardFlipGame";
import SpellingQuestionComponent from "../components/SpellingQuestion";
import DefinitionQuestionComponent from "../components/DefinitionQuestion";

// ── Question Generators ─────────────────────────────────────────────────────────

function generatePhonicsQuestions(format: PhonicsFormat, length: number): PhonicsQuestion[] {
  const pool = WORDS.filter((w) => w.phonemes.some((p) => PHONEMES.find((ph) => ph.id === p)));
  const questions: PhonicsQuestion[] = [];
  const used = new Set<string>();

  for (let i = 0; i < length; i++) {
    const phoneme = PHONEMES[Math.floor(Math.random() * PHONEMES.length)];
    const matching = pool.filter((w) => w.phonemes.includes(phoneme.id) && !used.has(w.word));
    const word = matching.length > 0
      ? matching[Math.floor(Math.random() * matching.length)]
      : pool[Math.floor(Math.random() * pool.length)];
    if (!word) continue;
    used.add(word.word);

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

function generateCardFlipCards(numPairs: number): CardFlipCard[] {
  const shuffled = [...PHONEMES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, numPairs);
  const cards: CardFlipCard[] = [];
  let id = 0;

  for (const phoneme of selected) {
    const word = WORDS.find((w) => w.phonemes.includes(phoneme.id));
    cards.push({
      id: id++,
      type: "phoneme",
      label: phoneme.ipa,
      ttsText: phoneme.ttsText,
      matchId: phoneme.id,
      flipped: false,
      matched: false,
    });
    cards.push({
      id: id++,
      type: "word",
      label: word?.word ?? phoneme.example,
      ttsText: word?.word ?? phoneme.example,
      matchId: phoneme.id,
      flipped: false,
      matched: false,
    });
  }

  return cards.sort(() => Math.random() - 0.5);
}

function generateSpellingQuestions(format: SpellingFormat, length: number): SpellingQuestion[] {
  const pool = [...WORDS].sort(() => Math.random() - 0.5);
  const questions: SpellingQuestion[] = [];

  for (let i = 0; i < Math.min(length, pool.length); i++) {
    const word = pool[i];
    const inputMode: "tiles" | "choice" =
      format === "mixed" ? (Math.random() > 0.5 ? "tiles" : "choice") : format;

    const choices = (inputMode === "choice" || format === "choice")
      ? [word.word, ...word.spellingDistractors].sort(() => Math.random() - 0.5).slice(0, 4)
      : undefined;

    questions.push({
      category: "spelling",
      format,
      word,
      inputMode,
      choices,
    });
  }

  return questions;
}

function generateDefinitionQuestions(
  direction: DefinitionDirection,
  length: number,
): DefinitionQuestion[] {
  const pool = [...WORDS].sort(() => Math.random() - 0.5);
  const questions: DefinitionQuestion[] = [];

  for (let i = 0; i < Math.min(length, pool.length); i++) {
    const word = pool[i];
    let options: string[];
    let correctAnswer: string;

    if (direction === "def-to-word") {
      const distractors = WORDS
        .filter((w) => w.word !== word.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.word);
      options = [word.word, ...distractors].sort(() => Math.random() - 0.5);
      correctAnswer = word.word;
    } else {
      const distractors = WORDS
        .filter((w) => w.word !== word.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.definition);
      options = [word.definition, ...distractors].sort(() => Math.random() - 0.5);
      correctAnswer = word.definition;
    }

    questions.push({
      category: "definitions",
      direction,
      word,
      options,
      correctAnswer,
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

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="h-2 bg-[#888888]/20 retro-border" role="progressbar" aria-valuenow={current} aria-valuemax={total}>
      <div
        className="h-full bg-[#2EC4B6] transition-all duration-300 motion-reduce:transition-none"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

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

// ── Tap / Speed / PickWord format ──────────────────────────────────────────────

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
  const [timerPct, setTimerPct] = useState(100);
  const companion = useGame().companion;
  const speedMode = question.format === "speed";
  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;
  const timeAnnounceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!speedMode) return;
    setTimerPct(100);

    const interval = setInterval(() => {
      setTimerPct((prev) => {
        const next = Math.max(0, prev - 100 / (GAME_CONFIG.SPEED_TIMER_MS / 50));
        if (next <= 20 && prev > 20 && timeAnnounceRef.current) {
          timeAnnounceRef.current.textContent = "Time is running out!";
        }
        return next;
      });
    }, 50);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!feedbackRef.current) {
        if (timeAnnounceRef.current) {
          timeAnnounceRef.current.textContent = "Time's up!";
        }
        onAnswer("");
      }
    }, GAME_CONFIG.SPEED_TIMER_MS);

    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [question.phoneme.id, speedMode, onAnswer]);

  function handleAnswer(opt: string) {
    if (feedback) return;
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
      <div ref={timeAnnounceRef} className="sr-only" aria-live="assertive" aria-atomic="true" />
      {speedMode && (
        <div className="w-full h-3 retro-border bg-[#888888]/20 overflow-hidden">
          <div
            className={`h-full transition-all duration-[50ms] motion-reduce:transition-none ${timerPct > 20 ? "bg-[#2EC4B6]" : "bg-[#FF4136]"}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      )}

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

      {displayHint && <CompanionHint hint={displayHint} companion={companion} />}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function computeCorrectAnswer(q: Question): string {
  if (q.category === "phonics") return q.correctAnswer;
  if (q.category === "definitions") return q.correctAnswer;
  return q.word.word;
}

// ── Main GameScreen ────────────────────────────────────────────────────────────

interface GameScreenProps {
  onRoundComplete: () => void;
}

export default function GameScreen({ onRoundComplete }: GameScreenProps) {
  const { round, setScreen, answerQuestion, muted, toggleMute, companion } = useGame();
  const { speak } = useAudio();
  const [hintCount, setHintCount] = useState(0);

  const cardFlipDeckRef = useRef<CardFlipCard[]>([]);

  const [localRound] = useState(() => {
    if (round && round.questions.length === 0) {
      const config = round.config;
      let questions: Question[] = [];

      switch (config.category) {
        case "phonics": {
          const format = config.phonicsFormat ?? "tap";
          if (format === "card-flip") {
            cardFlipDeckRef.current = generateCardFlipCards(GAME_CONFIG.CARD_FLIP_PAIRS);
            const word = WORDS[0];
            questions.push({
              category: "phonics",
              format: "card-flip",
              phoneme: PHONEMES[0],
              word,
              correctAnswer: word.word,
              options: [word.word],
            });
          } else {
            questions = generatePhonicsQuestions(format, config.length);
          }
          break;
        }
        case "spelling": {
          const format = config.spellingFormat ?? "choice";
          questions = generateSpellingQuestions(format, config.length);
          break;
        }
        case "definitions": {
          const direction = config.definitionDirection ?? "def-to-word";
          questions = generateDefinitionQuestions(direction, config.length);
          break;
        }
      }

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
  const question = questions[currentIndex] as Question | undefined;

  useEffect(() => {
    if (!round || roundCompleted.current) return;
    if (round.currentIndex >= questions.length && questions.length > 0) {
      roundCompleted.current = true;
      onRoundComplete();
    }
  }, [round, questions.length, onRoundComplete]);

  useEffect(() => {
    setHintCount(0);
  }, [currentIndex]);

  function handleAnswer(answer: string) {
    if (feedback || !question) return;

    const correct = answer.toLowerCase() === computeCorrectAnswer(question).toLowerCase();
    setFeedback(correct ? "correct" : "wrong");
    answerQuestion(answer);
    feedbackTimer.current = setTimeout(() => {
      setFeedback(null);
    }, GAME_CONFIG.FEEDBACK_DURATION_MS);
  }

  if (!round || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#A2D2FF] dark:bg-[#0A1128]">
        <div className="skeleton w-48 h-8 rounded" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#A2D2FF] dark:bg-[#0A1128]">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Question {currentIndex + 1} of {questions.length}
      </div>
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
        {question.category === "phonics" && question.format === "card-flip" ? (
          <CardFlipGame
            cards={cardFlipDeckRef.current}
            onComplete={() => handleAnswer(question.word.word)}
            speak={speak}
          />
        ) : question.category === "spelling" ? (
          <SpellingQuestionComponent
            question={question as SpellingQuestion}
            onAnswer={handleAnswer}
            feedback={feedback}
            companion={companion}
            hintCount={hintCount}
            onHint={() => setHintCount((n) => n + 1)}
            speak={speak}
          />
        ) : question.category === "definitions" ? (
          <DefinitionQuestionComponent
            question={question as DefinitionQuestion}
            onAnswer={handleAnswer}
            feedback={feedback}
            companion={companion}
            hintCount={hintCount}
            onHint={() => setHintCount((n) => n + 1)}
            speak={speak}
          />
        ) : (
          <TapQuestion
            question={question as PhonicsQuestion}
            onAnswer={handleAnswer}
            feedback={feedback}
            speak={speak}
          />
        )}
      </div>
    </div>
  );
}
