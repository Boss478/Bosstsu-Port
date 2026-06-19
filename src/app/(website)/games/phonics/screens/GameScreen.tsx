"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useGame } from "../context";
import {
  GAME_CONFIG,
  COMPANIONS,
  PHONEME_EXAMPLE_WORDS,
  PHONEME_TRIM_DURATIONS,
} from "../constants";
import type {
  PhonicsQuestion,
  SpellingQuestion,
  DefinitionQuestion,
  IpaToWordQuestion,
  WordToIpaQuestion,
  SynonymQuestion,
  ExerciseQuestion,
  CardFlipCard,
  Question,
  CompanionId,
  WordData,
} from "../types";
import { WORDS } from "../words";
import { useAudio } from "@/hooks/useAudio";
import {
  buildQuestions,
  buildRetryQuestions,
  generateCardFlipCards,
  computeCorrectAnswer,
} from "../question-generators";
import HUD from "../components/HUD";
import ProgressBar from "../components/ProgressBar";
import CardFlipGame from "../components/CardFlipGame";
import SpellingQuestionComponent from "../components/SpellingQuestion";
import DefinitionQuestionComponent from "../components/DefinitionQuestion";
import IpaToWordQuestionComponent from "../components/IpaToWordQuestion";
import WordToIpaQuestionComponent from "../components/WordToIpaQuestion";
import SynonymQuestionComponent from "../components/SynonymQuestion";
import CompanionHint from "../components/CompanionHint";
import MascotCanvas from "../components/MascotCanvas";

function TapQuestion({
  question,
  feedback,
  speak,
  playWordAudio,
  playPhonemeAudio,
  selectedAnswer,
  setSelectedAnswer,
}: {
  question: PhonicsQuestion;
  feedback: "correct" | "wrong" | null;
  speak: (text: string) => void;
  playWordAudio: (word: string) => Promise<void>;
  playPhonemeAudio: (
    exampleWord: string,
    fallbackText: string,
    trimDurationMs: number
  ) => Promise<void>;
  selectedAnswer: string | null;
  setSelectedAnswer: (ans: string | null) => void;
}) {
  const [hintLevel, setHintLevel] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [timerPct, setTimerPct] = useState(100);
  const [isRippling, setIsRippling] = useState(false);

  const companion = useGame().companion;
  const speedMode = question.format === "speed";
  const feedbackRef = useRef(feedback);
  useEffect(() => {
    feedbackRef.current = feedback;
  }, [feedback]);
  const timeAnnounceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!speedMode) return;

    const interval = setInterval(() => {
      setTimerPct((prev) => {
        const next = Math.max(
          0,
          prev - 100 / (GAME_CONFIG.SPEED_TIMER_MS / 50)
        );
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
        setSelectedAnswer("");
      }
    }, GAME_CONFIG.SPEED_TIMER_MS);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [question.phoneme.id, speedMode, setSelectedAnswer]);

  const handleSpeak = useCallback(() => {
    const exWord = PHONEME_EXAMPLE_WORDS[question.phoneme.id];
    if (exWord) {
      const trimMs =
        PHONEME_TRIM_DURATIONS[question.phoneme.id] ?? 100;
      playPhonemeAudio(exWord, question.phoneme.soundText, trimMs);
    } else {
      speak(question.phoneme.soundText);
    }
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 1800);
  }, [playPhonemeAudio, speak, question.phoneme.id, question.phoneme.soundText]);

  const handleAnswerSelect = useCallback(
    (opt: string) => {
      if (feedbackRef.current) return;
      playWordAudio(opt);
      setSelectedAnswer(opt);
      if (opt !== question.correctAnswer) {
        setWrongAttempts((n) => n + 1);
        if (wrongAttempts + 1 >= 2)
          setHintLevel((l) => Math.min(l + 1, 3));
      }
    },
    [question.correctAnswer, wrongAttempts, setSelectedAnswer, playWordAudio]
  );

  const displayHint =
    hintLevel > 0
      ? COMPANIONS[companion]?.hints?.phonics?.[hintLevel] ?? null
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div
        ref={timeAnnounceRef}
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
      />
      {speedMode && (
        <div className="w-full h-3 bg-slate-300/30 dark:bg-slate-700/40 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-[50ms] motion-reduce:transition-none relative ${
              timerPct > 20
                ? "bg-gradient-to-r from-[#2EC4B6] to-emerald-400"
                : "bg-gradient-to-r from-[#FF70A6] to-rose-500"
            }`}
            style={{ width: `${timerPct}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-0.5" />
          </div>
        </div>
      )}

      <div className="relative glass-panel p-8 rounded-3xl border border-white/20 shadow-md text-center max-w-sm mx-auto w-full overflow-hidden">
        {isRippling && (
          <>
            <div className="absolute inset-0 rounded-3xl border-4 border-[#C8A44E]/30 animate-audio-ripple" />
            <div
              className="absolute inset-0 rounded-3xl border-4 border-[#C8A44E]/15 animate-audio-ripple"
              style={{ animationDelay: "0.6s" }}
            />
            <div className="absolute bottom-4 inset-x-0 flex items-end justify-center gap-[3px] z-10 h-6">
              {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 max-w-1 rounded-full bg-[#C8A44E]/60 animate-equalizer-bar"
                  style={{
                    height: `${4 + h * 3}px`,
                    animationDelay: `${i * 0.08}s`,
                    transformOrigin: 'bottom',
                  }}
                />
              ))}
            </div>
          </>
        )}
        <div
          className="text-7xl font-extrabold text-slate-800 dark:text-[#F7E1A0] tracking-widest relative z-10 cursor-pointer hover:opacity-80 active:scale-95 transition-all"
          style={{ fontFamily: "var(--font-geist-mono)" }}
          onClick={handleSpeak}
          title="Click to hear the sound"
        >
          {question.phoneme.ipa}
        </div>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest relative z-10">
          {question.phoneme.name}
        </p>
      </div>

      <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
        Which word starts with this sound?
      </p>

      <div className="grid grid-cols-2 gap-3.5 max-w-md mx-auto w-full">
        {question.options.map((opt) => {
          const isSelected = selectedAnswer === opt;
          const isCorrect = opt === question.correctAnswer;
          const wordData = WORDS.find(
            (w) => w.word.toLowerCase() === opt.toLowerCase()
          );

          let btnClass =
            "w-full px-4 py-5 font-bold text-sm tracking-wide text-center rounded-2xl backdrop-blur-xs border-2 transition-all btn-3d shadow-sm cursor-pointer ";
          let borderStyle = {
            "--border-color": "rgba(0,0,0,0.12)",
          } as React.CSSProperties;

          if (feedback === "correct" && isCorrect) {
            btnClass +=
              "bg-[#2EC4B6] text-white border-[#2EC4B6] hover:bg-[#2EC4B6] dark:border-[#2EC4B6] animate-correct-bounce";
            borderStyle = { "--border-color": "#1e8a7f" } as React.CSSProperties;
          } else if (feedback === "wrong" && isCorrect) {
            btnClass +=
              "bg-[#2EC4B6]/40 text-emerald-800 dark:text-emerald-200 border-[#2EC4B6]/40";
            borderStyle = { "--border-color": "transparent" } as React.CSSProperties;
          } else if (feedback === "wrong" && isSelected && !isCorrect) {
            btnClass +=
              "bg-[#FF70A6] text-white border-[#FF70A6] hover:bg-[#FF70A6] dark:border-[#FF70A6] animate-shake";
            borderStyle = { "--border-color": "#b83f50" } as React.CSSProperties;
          } else if (isSelected && !feedback) {
            btnClass +=
              "border-[#C8A44E] bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 text-[#C8A44E] dark:text-[#F7E1A0]";
            borderStyle = { "--border-color": "#a8853b" } as React.CSSProperties;
          } else {
            btnClass +=
              "bg-white/60 dark:bg-slate-800/60 border-white/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-700/80";
          }

          return (
            <button
              key={opt}
              id={`option-${opt}`}
              className={btnClass}
              onClick={() => handleAnswerSelect(opt)}
              disabled={!!feedback}
              style={borderStyle}
            >
              <div className="flex flex-col items-center justify-center">
                <span>{opt}</span>
                {feedback && wordData && (
                  <span
                    className={`text-xs mt-1 font-semibold transition-all duration-300 animate-fade-in ${
                      feedback === "correct" && isCorrect
                        ? "text-emerald-100"
                        : feedback === "wrong" && isSelected && !isCorrect
                          ? "text-rose-100"
                          : feedback === "wrong" && isCorrect
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-slate-500 dark:text-slate-400"
                    }`}
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {wordData.ipa}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {displayHint && (
        <CompanionHint
          hint={displayHint}
          companion={companion}
          feedback={feedback}
        />
      )}
    </div>
  );
}

import BackgroundDownloadWidget, { type BackgroundDownloadState } from "../components/BackgroundDownloadWidget";

interface GameScreenProps {
  onRoundComplete: () => void;
  bgDownloadState: BackgroundDownloadState | null;
}

export default function GameScreen({ onRoundComplete, bgDownloadState }: GameScreenProps) {
  const {
    round,
    setScreen,
    answerQuestion,
    nextQuestion,
    muted,
    toggleMute,
    companion,
    selectedLesson,
  } = useGame();
  const { speak, playWordAudio, playPhonemeAudio, prefetchWords } = useAudio();

  const [cardFlipDeck] = useState<CardFlipCard[]>(() => {
    return generateCardFlipCards(
      GAME_CONFIG.CARD_FLIP_PAIRS,
      round?.config.level ?? "all",
      selectedLesson?.phonemeIds
    );
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    if (!round) return [];
    const config = round.config;
    if (config.retryWords && config.retryWords.length > 0) {
      return buildRetryQuestions(config, config.retryWords);
    }
    const filterPhonemes = selectedLesson?.phonemeIds;
    return buildQuestions(config, filterPhonemes);
  });

  const adaptiveFired = useRef(false);
  const roundCompleted = useRef(false);
  const answerQuestionRef = useRef(answerQuestion);
  const roundRef = useRef(round);

  useEffect(() => {
    answerQuestionRef.current = answerQuestion;
  }, [answerQuestion]);

  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  const initialWordsArray = useMemo(() => {
    const words = new Set<string>();
    questions.forEach((q) => {
      if ("word" in q && q.word?.word) words.add(q.word.word);
      if (q.category === "exercise") {
        const ex = q as { data: { word?: { word: string } } };
        if (ex.data?.word?.word) words.add(ex.data.word.word);
      }
      if ("options" in q && Array.isArray(q.options)) {
        q.options.forEach((o) => {
          if (typeof o === "string" && !o.includes(" ")) words.add(o);
        });
      }
      if ("choices" in q && Array.isArray(q.choices)) {
        q.choices.forEach((c) => {
          if (typeof c === "string" && !c.includes(" ")) words.add(c);
        });
      }
    });
    return Array.from(words);
  }, [questions]);

  const [isAudioLoading, setIsAudioLoading] = useState(() => initialWordsArray.length > 0);
  const [loadedCount, setLoadedCount] = useState(0);
  const totalCount = initialWordsArray.length;

  useEffect(() => {
    if (initialWordsArray.length === 0) {
      return;
    }

    let active = true;
    const timeout = setTimeout(() => {
      if (active) setIsAudioLoading(false);
    }, 2500);

    prefetchWords(initialWordsArray, async (loaded, total) => {
      if (!active) return;
      setLoadedCount(loaded);
      if (loaded >= total) {
        clearTimeout(timeout);
        // Wait 1.2 seconds to show completion state
        await new Promise((resolve) => setTimeout(resolve, 1200));
        if (active) {
          setIsAudioLoading(false);
        }
      }
    });

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [initialWordsArray, prefetchWords]);

  const currentIndex = round?.currentIndex ?? 0;
  const question = questions[currentIndex] as Question | undefined;
  const totalQuestions = questions.length;

  const questionRef = useRef(question);
  const questionsLengthRef = useRef(questions.length);

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  useEffect(() => {
    questionsLengthRef.current = questions.length;
  }, [questions.length]);

  const handleAnswer = useCallback(
    (answer: string) => {
      const q = questionRef.current;
      if (!q) return;
      answerQuestionRef.current(answer, q);

      const r = roundRef.current;
      if (r && !r.config.retryWords && !r.config.isPlacement && !adaptiveFired.current) {
        const answeredSoFar = r.currentIndex + 1;
        const correctsSoFar =
          r.corrects +
          (answer.toLowerCase() ===
          computeCorrectAnswer(q).toLowerCase()
            ? 1
            : 0);
        const pct = correctsSoFar / answeredSoFar;
        if (pct < 0.6 && questionsLengthRef.current < 30) {
          const more = buildQuestions(r.config);
          setQuestions((prev) => [...prev, ...more]);
          adaptiveFired.current = true;
        }
      }
    },
    []
  );

  const handleContinue = useCallback(() => {
    nextQuestion();
  }, [nextQuestion]);

  useEffect(() => {
    if (!round || roundCompleted.current) return;
    if (round.currentIndex >= totalQuestions && totalQuestions > 0) {
      roundCompleted.current = true;
      onRoundComplete();
    }
  }, [round, totalQuestions, onRoundComplete]);

  if (!round || questions.length === 0 || !question) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#E0F2FE] via-[#F0FDFA] to-[#FEF3C7] dark:from-[#0B132B] dark:via-[#1B254B] dark:to-[#3E1B5D] min-h-full">
        <div className="skeleton w-48 h-8 rounded" />
      </div>
    );
  }

  if (isAudioLoading) {
    const pct =
      totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0;
    const isDone = loadedCount >= totalCount && totalCount > 0;
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#E0F2FE] via-[#F0FDFA] to-[#FEF3C7] dark:from-[#0B132B] dark:via-[#1B254B] dark:to-[#3E1B5D] min-h-full px-6 text-center">
        <div className="glass-panel p-8 rounded-3xl border border-white/20 shadow-xl max-w-sm w-full flex flex-col items-center gap-6">
          <MascotCanvas
            companionId={companion}
            size={72}
            animationState={isDone ? "celebrate" : "idle"}
            className="rounded-2xl"
          />
          <div className="space-y-2 w-full">
            <h3
              className={`text-lg font-black text-slate-800 dark:text-white ${isDone ? "" : "animate-pulse"}`}
              style={{ fontFamily: "var(--font-mali)" }}
            >
              {isDone ? "Status: Done" : "Status: Downloading..."}
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isDone ? "All audio has been downloaded." : `Downloaded ${loadedCount}/${totalCount} (${pct}%)`}
            </p>
          </div>
          <div className="w-full space-y-2">
            <div className="h-4 bg-slate-300/30 dark:bg-slate-900/40 rounded-full border border-white/20 overflow-hidden p-0.5 shadow-inner relative">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${isDone ? "from-emerald-400 to-teal-500" : "from-[#2EC4B6] to-[#C8A44E]"} transition-all duration-300`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              <span>{isDone ? "DOWNLOAD COMPLETE" : "LOADING SOUNDS"}</span>
              <span>
                {loadedCount} / {totalCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isCardFlip =
    question.category === "phonics" && question.format === "card-flip";

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-[#E0F2FE] via-[#F0FDFA] to-[#FEF3C7] dark:from-[#0B132B] dark:via-[#1B254B] dark:to-[#3E1B5D] overflow-hidden min-h-full justify-between relative">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Question {currentIndex + 1} of {totalQuestions}
      </div>

      <BackgroundDownloadWidget state={bgDownloadState} className="top-[95px]" />

      <div className="shrink-0">
        <HUD
          current={currentIndex}
          total={totalQuestions}
          score={round.score}
          streak={round.streak}
          muted={muted}
          onToggleMute={toggleMute}
          onSettings={() => setScreen("settings")}
        />
        <div className="px-5 py-2 z-10 relative">
          <ProgressBar current={currentIndex} total={totalQuestions} />
        </div>
      </div>

      {isCardFlip ? (
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="flex flex-col justify-center px-6 py-4 max-w-lg mx-auto w-full min-h-full">
            <CardFlipGame
              cards={cardFlipDeck}
              onComplete={() => {
                answerQuestion(question.word.word, question);
                setTimeout(onRoundComplete, 100);
              }}
              speak={speak}
              playWordAudio={playWordAudio}
            />
          </div>
        </div>
      ) : (
        <ActiveQuestion
          key={currentIndex}
          question={question}
          onAnswer={handleAnswer}
          onContinue={handleContinue}
          companion={companion}
          speak={speak}
          playWordAudio={playWordAudio}
          playPhonemeAudio={playPhonemeAudio}
        />
      )}
    </div>
  );
}

interface ActiveQuestionProps {
  question: Question;
  onAnswer: (answer: string) => void;
  onContinue: () => void;
  companion: CompanionId;
  speak: (text: string) => void;
  playWordAudio: (word: string) => Promise<void>;
  playPhonemeAudio: (
    exampleWord: string,
    fallbackText: string,
    trimDurationMs: number
  ) => Promise<void>;
}

function getActiveWordData(q: Question): WordData | undefined {
  if ("word" in q && q.word) return (q as { word: WordData }).word;
  if (q.category === "exercise") {
    const ex = q as { data?: { word?: WordData } };
    return ex.data?.word;
  }
  return undefined;
}

function ActiveQuestion({
  question,
  onAnswer,
  onContinue,
  companion,
  speak,
  playWordAudio,
  playPhonemeAudio,
}: ActiveQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [hintCount, setHintCount] = useState(0);
  const [flashColor, setFlashColor] = useState<"emerald" | "rose" | null>(null);
  const [scorePopup, setScorePopup] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);
  const activeWord = getActiveWordData(question);

  const handleCheck = () => {
    if (!selectedAnswer || feedback) return;
    const correct =
      selectedAnswer.toLowerCase() ===
      computeCorrectAnswer(question).toLowerCase();
    setFeedback(correct ? "correct" : "wrong");
    onAnswer(selectedAnswer);

    setFlashColor(correct ? "emerald" : "rose");
    setTimeout(() => setFlashColor(null), 600);

    if (correct) {
      setScorePopup(true);
      setTimeout(() => setScorePopup(false), 1000);
      setParticles(Array.from({ length: 8 }, () => Math.random()));
      setTimeout(() => setParticles([]), 800);
    }
  };

  const isSpelling = question.category === "spelling";
  const isDefinition = question.category === "definitions";
  const isIpaWord = question.category === "ipa-word";
  const isWordIpa = question.category === "word-ipa";
  const isSynonyms = question.category === "synonyms";
  const isExercise = question.category === "exercise";

  let exerciseSubQuestion: Question | null = null;
  if (isExercise) {
    const ex = question as ExerciseQuestion;
    if (ex.data) {
      exerciseSubQuestion = {
        ...(ex.data as unknown as Question),
        category: ex.subType === 'practice' ? 'practice'
          : ex.subType === 'ipa-word' ? 'ipa-word'
          : ex.subType === 'word-ipa' ? 'word-ipa'
          : 'synonyms',
      } as Question;
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0 relative">
      {flashColor && (
        <div
          className={`fixed inset-0 pointer-events-none z-[60] transition-opacity ${
            flashColor === "emerald" ? "bg-emerald-500/20" : "bg-rose-500/20"
          }`}
          style={{ animation: "flash-fade 0.6s ease-out forwards" }}
        />
      )}
      {scorePopup && (
        <div className="absolute top-2 right-4 z-10 pointer-events-none animate-score-popup">
          <span className="text-2xl font-black text-[#2EC4B6] drop-shadow-lg">
            +10
          </span>
        </div>
      )}
      {particles.map((seed, i) => {
        const angle = (seed * 360);
        const dist = 40 + seed * 40;
        return (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full pointer-events-none z-10 animate-particle"
            style={{
              backgroundColor: i % 2 === 0 ? "#FFBA08" : "#2EC4B6",
              left: "50%",
              top: "50%",
              "--dx": `${Math.cos(angle * Math.PI / 180) * dist}px`,
              "--dy": `${Math.sin(angle * Math.PI / 180) * dist}px`,
              animationDelay: `${i * 0.04}s`,
            } as React.CSSProperties}
          />
        );
      })}
      <style>{`
        @keyframes flash-fade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes equalizer-bar {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.6); }
        }
        .animate-equalizer-bar {
          animation: equalizer-bar 0.6s ease-in-out infinite;
        }
        @keyframes score-popup {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-80px) scale(1.3); opacity: 0; }
        }
        @keyframes particle {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
        }
      `}</style>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col justify-center px-6 py-4 max-w-lg mx-auto w-full min-h-full">
          {isExercise && exerciseSubQuestion ? (
            (exerciseSubQuestion.category === 'ipa-word' || exerciseSubQuestion.category === 'practice' ? (
              exerciseSubQuestion.category === 'ipa-word' ? (
                <IpaToWordQuestionComponent
                  question={exerciseSubQuestion as unknown as IpaToWordQuestion}
                  feedback={feedback}
                  companion={companion}
                  hintCount={hintCount}
                  onHint={() => setHintCount((n) => n + 1)}
                  speak={speak}
                  playWordAudio={playWordAudio}
                  selectedAnswer={selectedAnswer}
                  setSelectedAnswer={setSelectedAnswer}
                />
              ) : (
                <TapQuestion
                  question={exerciseSubQuestion as unknown as PhonicsQuestion}
                  feedback={feedback}
                  speak={speak}
                  playWordAudio={playWordAudio}
                  playPhonemeAudio={playPhonemeAudio}
                  selectedAnswer={selectedAnswer}
                  setSelectedAnswer={setSelectedAnswer}
                />
              )
            ) : exerciseSubQuestion.category === 'word-ipa' ? (
              <WordToIpaQuestionComponent
                question={exerciseSubQuestion as unknown as WordToIpaQuestion}
                feedback={feedback}
                companion={companion}
                hintCount={hintCount}
                onHint={() => setHintCount((n) => n + 1)}
                speak={speak}
                playWordAudio={playWordAudio}
                selectedAnswer={selectedAnswer}
                setSelectedAnswer={setSelectedAnswer}
              />
            ) : (
              <SynonymQuestionComponent
                question={exerciseSubQuestion as unknown as SynonymQuestion}
                feedback={feedback}
                companion={companion}
                hintCount={hintCount}
                onHint={() => setHintCount((n) => n + 1)}
                speak={speak}
                playWordAudio={playWordAudio}
                selectedAnswer={selectedAnswer}
                setSelectedAnswer={setSelectedAnswer}
              />
            ))
          ) : isSpelling ? (
            <SpellingQuestionComponent
              key={question.word.word}
              question={question as SpellingQuestion}
              feedback={feedback}
              companion={companion}
              hintCount={hintCount}
              onHint={() => setHintCount((n) => n + 1)}
              speak={speak}
              playWordAudio={playWordAudio}
              selectedAnswer={selectedAnswer}
              setSelectedAnswer={setSelectedAnswer}
            />
          ) : isIpaWord ? (
            <IpaToWordQuestionComponent
              question={question as IpaToWordQuestion}
              feedback={feedback}
              companion={companion}
              hintCount={hintCount}
              onHint={() => setHintCount((n) => n + 1)}
              speak={speak}
              playWordAudio={playWordAudio}
              selectedAnswer={selectedAnswer}
              setSelectedAnswer={setSelectedAnswer}
            />
          ) : isWordIpa ? (
            <WordToIpaQuestionComponent
              question={question as WordToIpaQuestion}
              feedback={feedback}
              companion={companion}
              hintCount={hintCount}
              onHint={() => setHintCount((n) => n + 1)}
              speak={speak}
              playWordAudio={playWordAudio}
              selectedAnswer={selectedAnswer}
              setSelectedAnswer={setSelectedAnswer}
            />
          ) : isSynonyms ? (
            <SynonymQuestionComponent
              question={question as SynonymQuestion}
              feedback={feedback}
              companion={companion}
              hintCount={hintCount}
              onHint={() => setHintCount((n) => n + 1)}
              speak={speak}
              playWordAudio={playWordAudio}
              selectedAnswer={selectedAnswer}
              setSelectedAnswer={setSelectedAnswer}
            />
          ) : isDefinition ? (
            <DefinitionQuestionComponent
              question={question as DefinitionQuestion}
              feedback={feedback}
              companion={companion}
              hintCount={hintCount}
              onHint={() => setHintCount((n) => n + 1)}
              speak={speak}
              playWordAudio={playWordAudio}
              selectedAnswer={selectedAnswer}
              setSelectedAnswer={setSelectedAnswer}
            />
          ) : (
            <TapQuestion
              question={question as PhonicsQuestion}
              feedback={feedback}
              speak={speak}
              playWordAudio={playWordAudio}
              playPhonemeAudio={playPhonemeAudio}
              selectedAnswer={selectedAnswer}
              setSelectedAnswer={setSelectedAnswer}
            />
          )}
        </div>
      </div>

      <div
        className={`shrink-0 p-5 backdrop-blur-md border-t transition-all duration-300 relative z-30 ${
          feedback === "correct"
            ? "bg-emerald-500/90 dark:bg-emerald-950/90 border-emerald-400/40 text-white animate-slide-up-drawer"
            : feedback === "wrong"
              ? "bg-rose-500/90 dark:bg-rose-950/90 border-rose-400/40 text-white animate-slide-up-drawer"
              : "bg-white/60 dark:bg-slate-800/60 border-white/60 dark:border-slate-700/50"
        }`}
      >
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {feedback === "correct" && (
              <div className="flex items-center gap-3">
                <i className="fi fi-sr-star text-2xl text-yellow-300 animate-bounce flex items-center justify-center shrink-0" />
                <div className="min-w-0">
                  <p className="font-extrabold text-sm tracking-wide text-white">
                    Excellent Job!
                  </p>
                  <p className="text-[11px] text-emerald-100 uppercase font-bold tracking-widest mt-0.5">
                    You got it right!
                  </p>
                  {activeWord && (
                    <p className="text-[11px] text-white/80 mt-1 truncate">
                      {activeWord.word} <span className="font-mono">({activeWord.ipa})</span>
                    </p>
                  )}
                </div>
              </div>
            )}
            {feedback === "wrong" && (
              <div className="flex items-center gap-3 text-left">
                <i className="fi fi-sr-info text-2xl text-yellow-300 animate-shake flex items-center justify-center shrink-0" />
                <div className="min-w-0">
                  <p className="font-extrabold text-sm tracking-wide text-white">
                    Correct Answer:
                  </p>
                  <p className="text-xs font-mono font-bold tracking-wide mt-0.5 bg-black/15 px-2.5 py-0.5 rounded-lg inline-block text-white">
                    {computeCorrectAnswer(question)}
                  </p>
                  {activeWord && (
                    <p className="text-[11px] text-white/80 mt-1 truncate">
                      {activeWord.word} <span className="font-mono">({activeWord.ipa})</span>
                      {activeWord.definition && (
                        <span className="hidden sm:inline"> — {activeWord.definition}</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}
            {feedback === null && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase text-left">
                {selectedAnswer ? "Ready to verify!" : "Select an answer"}
              </p>
            )}
          </div>

          {feedback === null ? (
            <button
              className={`px-6 py-3.5 rounded-2xl font-extrabold text-xs tracking-wider uppercase btn-3d shadow-sm cursor-pointer select-none transition-all ${
                selectedAnswer
                  ? "bg-[#2EC4B6] text-white hover:brightness-105"
                  : "bg-slate-300 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border-b-0"
              }`}
              disabled={!selectedAnswer}
              onClick={handleCheck}
              style={
                selectedAnswer
                  ? ({ "--border-color": "#1b8a7e" } as React.CSSProperties)
                  : undefined
              }
            >
              CHECK
            </button>
          ) : (
            <button
              className={`px-6 py-3.5 rounded-2xl font-extrabold text-xs tracking-wider uppercase btn-3d shadow-md cursor-pointer select-none transition-all ${
                feedback === "correct"
                  ? "bg-white text-emerald-600 hover:bg-slate-100"
                  : "bg-white text-rose-600 hover:bg-slate-100"
              }`}
              onClick={onContinue}
              style={
                { "--border-color": "rgba(0,0,0,0.12)" } as React.CSSProperties
              }
            >
              CONTINUE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
