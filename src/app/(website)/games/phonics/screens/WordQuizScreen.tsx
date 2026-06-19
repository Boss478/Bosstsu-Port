"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useGame } from "../context";
import { useAudio } from "@/hooks/useAudio";
import { useAllWordEntries, type WordEntry } from "../hooks/useAllWordEntries";
import { LetterTileKeyboard } from "../components/LetterTileKeyboard";
import { PhonemeSoundboard } from "../components/PhonemeSoundboard";
import { QuizConfigModal, type QuizConfig, type QuizDirection } from "../components/QuizConfigModal";
import { PHONEMES } from "../constants";
import type { PhonemeData } from "../types";

type QuizPhase = "config" | "playing" | "feedback" | "results";

interface QuizQuestion {
  type: "word-to-ipa" | "ipa-to-word";
  word: WordEntry;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function WordQuizScreen() {
  const { setScreen } = useGame();
  const { playWordAudio } = useAudio();

  const [phase, setPhase] = useState<QuizPhase>("config");
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [livesLeft, setLivesLeft] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | "sequence" | null>(null);
  const [bestStreak, setBestStreak] = useState(0);
  const streakRef = useRef(0);

  const allWordEntries = useAllWordEntries();
  const quizPool = useMemo(() => {
    return allWordEntries.filter((w) => w.phonemeIds.length > 0 && w.ipa?.length);
  }, [allWordEntries]);

  const poolIndexRef = useRef(0);
  const shuffledPoolRef = useRef<WordEntry[]>([]);

  const currentQuestion = questions[questionIndex] || null;
  const isLastQuestion = config ? questionIndex >= questions.length - 1 : false;

  const [selectedPhonemes, setSelectedPhonemes] = useState<PhonemeData[]>([]);
  const [typedWord, setTypedWord] = useState("");
  const [tapEnabled, setTapEnabled] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === "playing" && config?.mode === "timer" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, config?.mode, timeLeft > 0]);

  useEffect(() => {
    if (config?.mode === "timer" && timeLeft <= 0 && phase === "playing") {
      setPhase("results");
    }
  }, [timeLeft, config?.mode, phase]);

  const startQuiz = useCallback((cfg: QuizConfig) => {
    shuffledPoolRef.current = shuffleArray(quizPool);
    poolIndexRef.current = 0;
    const qs: QuizQuestion[] = [];
    const count = cfg.mode === "practice" ? cfg.roundLength : 50;
    for (let i = 0; i < count; i++) {
      const word = shuffledPoolRef.current[i % shuffledPoolRef.current.length];
      if (!word) continue;
      let type: QuizDirection;
      if (cfg.direction === "mixed") {
        type = Math.random() < 0.5 ? "word-to-ipa" : "ipa-to-word";
      } else {
        type = cfg.direction;
      }
      qs.push({ type, word });
    }
    setQuestions(qs);
    setQuestionIndex(0);
    setScore(0);
    setIncorrect(0);
    streakRef.current = 0;
    setBestStreak(0);
    setLivesLeft(cfg.mode === "endless" ? cfg.lives : cfg.mode === "hardcore" ? 1 : 999);
    setTimeLeft(cfg.mode === "timer" ? cfg.timeLimit : 0);
    setSelectedPhonemes([]);
    setTypedWord("");
    setFeedbackType(null);
    setTapEnabled(true);
    setConfig(cfg);
    setPhase("playing");
  }, [quizPool]);

  const submitAnswer = useCallback(() => {
    if (!currentQuestion || !config) return;
    setTapEnabled(false);

    let isCorrect = false;
    let isSequence = false;

    if (currentQuestion.type === "word-to-ipa") {
      const userIds = selectedPhonemes.map((p) => p.id);
      const acceptedSets: string[][] = [currentQuestion.word.phonemeIds];
      if (currentQuestion.word.altPhonemeIds) {
        acceptedSets.push(currentQuestion.word.altPhonemeIds);
      }
      for (const set of acceptedSets) {
        if (userIds.length !== set.length) continue;
        const sortedUser = [...userIds].sort().join("|");
        const sortedSet = [...set].sort().join("|");
        if (sortedUser === sortedSet) {
          if (userIds.join("|") === set.join("|")) {
            isCorrect = true;
          } else {
            isSequence = true;
          }
          break;
        }
      }
    } else {
      const userWord = typedWord.trim().toUpperCase();
      const correctWord = currentQuestion.word.word.toUpperCase();
      isCorrect = userWord === correctWord;
    }

    if (isCorrect) {
      setScore((s) => s + 1);
      streakRef.current += 1;
      setBestStreak((b) => Math.max(b, streakRef.current));
      setFeedbackType("correct");
    } else if (isSequence) {
      setIncorrect((i) => i + 1);
      streakRef.current = 0;
      setFeedbackType("sequence");
      if (config.mode === "endless" || config.mode === "hardcore") {
        setLivesLeft((l) => l - 1);
      }
    } else {
      setIncorrect((i) => i + 1);
      streakRef.current = 0;
      setFeedbackType("wrong");
      if (config.mode === "endless" || config.mode === "hardcore") {
        setLivesLeft((l) => l - 1);
      }
    }
    setPhase("feedback");
  }, [currentQuestion, config, selectedPhonemes, typedWord]);

  useEffect(() => {
    if (phase !== "feedback" || !config) return;
    if (config.mode === "endless" && livesLeft <= 0) {
      const t = setTimeout(() => setPhase("results"), 1500);
      return () => clearTimeout(t);
      return;
    }
    if (config.mode === "hardcore" && feedbackType !== "correct") {
      const t = setTimeout(() => setPhase("results"), 1500);
      return () => clearTimeout(t);
      return;
    }
  }, [phase, config, livesLeft, feedbackType]);

  const handleContinue = useCallback(() => {
    if (!config) return;
    if (config.mode === "endless" && livesLeft <= 0) {
      setPhase("results");
      return;
    }
    if (config.mode === "hardcore" && feedbackType !== "correct") {
      setPhase("results");
      return;
    }
    if (isLastQuestion) {
      setPhase("results");
      return;
    }
    setQuestionIndex((i) => i + 1);
    setSelectedPhonemes([]);
    setTypedWord("");
    setFeedbackType(null);
    setTapEnabled(true);
    setPhase("playing");
  }, [config, livesLeft, feedbackType, isLastQuestion]);

  const appendLetter = useCallback((char: string) => {
    if (!tapEnabled) return;
    setTypedWord((prev) => (prev + char).toUpperCase());
  }, [tapEnabled]);

  const handleBackspaceKey = useCallback(() => {
    if (!tapEnabled) return;
    setTypedWord((prev) => prev.slice(0, -1));
  }, [tapEnabled]);

  const appendPhoneme = useCallback((p: PhonemeData) => {
    if (!tapEnabled) return;
    setSelectedPhonemes((prev) => [...prev, p]);
  }, [tapEnabled]);

  const removeLastPhoneme = useCallback(() => {
    if (!tapEnabled) return;
    setSelectedPhonemes((prev) => prev.slice(0, -1));
  }, [tapEnabled]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase === "playing" && !tapEnabled) return;
      if (phase === "playing" && currentQuestion?.type === "ipa-to-word") {
        const key = e.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
          appendLetter(key);
          return;
        }
        if (e.key === "Backspace") {
          handleBackspaceKey();
          return;
        }
      }
      if (phase === "feedback" && e.key === " " && tapEnabled) {
        e.preventDefault();
        handleContinue();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [phase, tapEnabled, currentQuestion, appendLetter, handleBackspaceKey, handleContinue]);

  const totalQuestions = questions.length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-gradient-to-b from-[#E0F2FE] via-[#F0FDFA] to-[#FEF3C7] dark:from-[#0B132B] dark:via-[#1B254B] dark:to-[#3E1B5D]">
      {phase === "config" && (
        <QuizConfigModal
          onStart={startQuiz}
          onClose={() => setScreen("path")}
        />
      )}

      {(phase === "playing" || phase === "feedback") && config && (
        <>
          <div className="shrink-0 px-5 py-3 flex items-center justify-between border-b border-white/20 dark:border-slate-800/40">
            <button
              onClick={() => setScreen("word-builder")}
              className="w-8 h-8 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
              aria-label="Back"
            >
              <i className="fi fi-sr-arrow-left text-sm" />
            </button>
            <div className="flex items-center gap-4 text-[10px] font-extrabold tracking-wider">
              <span className="text-emerald-600 dark:text-emerald-400">
                <i className="fi fi-sr-check mr-1" />{score}
              </span>
              <span className="text-rose-500 dark:text-rose-400">
                <i className="fi fi-sr-cross mr-1" />{incorrect}
              </span>
              {config.mode === "endless" && (
                <span className="text-sky-600 dark:text-sky-400">
                  <i className="fi fi-sr-heart mr-1" />{livesLeft}
                </span>
              )}
              {config.mode === "timer" && (
                <span className={`${timeLeft <= 10 ? "text-rose-500 animate-pulse" : "text-slate-600 dark:text-slate-300"}`}>
                  <i className="fi fi-sr-clock mr-1" />{timeLeft}s
                </span>
              )}
              <span className="text-slate-500 dark:text-slate-400">
                {questionIndex + 1}/{totalQuestions}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 space-y-4 pt-5">
            {currentQuestion && currentQuestion.type === "word-to-ipa" && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    Build the IPA for this word
                  </p>
                  <p
                    className="text-3xl font-black text-slate-800 dark:text-[#F7E1A0]"
                    style={{ fontFamily: "var(--font-mali)" }}
                  >
                    {currentQuestion.word.word}
                  </p>
                  <button
                    onClick={() => playWordAudio(currentQuestion!.word.word)}
                    className="mt-2 w-10 h-10 rounded-xl bg-[#C8A44E]/20 border border-[#C8A44E]/40 text-[#C8A44E] hover:bg-[#C8A44E]/30 transition-colors cursor-pointer flex items-center justify-center mx-auto"
                    aria-label="Listen to word"
                  >
                    <i className="fi fi-sr-volume text-sm" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 min-h-[44px] p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-slate-800/60">
                  {selectedPhonemes.length === 0 ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-bold px-2">
                      Tap phonemes to build the IPA...
                    </span>
                  ) : (
                    <>
                      <span
                        className="text-sm font-black text-slate-800 dark:text-white"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        /{selectedPhonemes.map((p) => p.ipa.replace(/\//g, "")).join(" ")}/
                      </span>
                      <button
                        onClick={removeLastPhoneme}
                        className="px-2 py-1 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-500 hover:text-rose-500 hover:border-rose-300 transition-colors cursor-pointer text-sm"
                        aria-label="Remove last phoneme"
                      >
                        &#9003;
                      </button>
                    </>
                  )}
                </div>

                <PhonemeSoundboard
                  layoutMode="vertical"
                  phonemeLabelMode="both"
                  selectedPhonemeIds={selectedPhonemes.map((p) => p.id)}
                  onPhonemeClick={appendPhoneme}
                />
              </div>
            )}

            {currentQuestion && currentQuestion.type === "ipa-to-word" && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    Type the word for this IPA
                  </p>
                  <p className="text-xl font-black text-slate-800 dark:text-white" style={{ fontFamily: "var(--font-geist-mono)" }}>
                    /{(currentQuestion.word.ipa || "").replace(/\//g, "")}/
                  </p>
                  {config.difficulty === "normal" && (
                    <p className="text-3xl font-black text-slate-800 dark:text-[#F7E1A0] mt-2" style={{ fontFamily: "var(--font-mali)" }}>
                      {currentQuestion.word.word}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 min-h-[44px] p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-slate-800/60">
                  <input
                    type="text"
                    value={typedWord}
                    onChange={(e) => setTypedWord(e.target.value.toUpperCase())}
                    disabled={!tapEnabled}
                    className="bg-transparent text-center text-lg font-extrabold text-slate-800 dark:text-[#F7E1A0] outline-none border-none w-full max-w-[200px] disabled:opacity-50"
                    style={{ fontFamily: "var(--font-mali)" }}
                    placeholder="Type the word..."
                    autoFocus
                  />
                  {typedWord.length > 0 && (
                    <button
                      onClick={() => setTypedWord("")}
                      className="px-2 py-1 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-500 hover:text-rose-500 hover:border-rose-300 transition-colors cursor-pointer"
                      aria-label="Clear"
                    >
                      <i className="fi fi-sr-cross text-[10px]" />
                    </button>
                  )}
                </div>

                <div className="bg-white/35 dark:bg-slate-900/30 border border-white/40 dark:border-slate-800/50 rounded-3xl p-4 backdrop-blur-md">
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-3">
                    Letter Tiles
                  </p>
                  <LetterTileKeyboard
                    layout="qwerty"
                    onChar={appendLetter}
                    onBackspace={handleBackspaceKey}
                    disabled={!tapEnabled}
                  />
                </div>
              </div>
            )}

            {phase === "playing" && (
              <button
                onClick={submitAnswer}
                disabled={
                  (currentQuestion?.type === "word-to-ipa" && selectedPhonemes.length === 0) ||
                  (currentQuestion?.type === "ipa-to-word" && typedWord.trim().length === 0)
                }
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-extrabold tracking-wider uppercase shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-600 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Check Answer
              </button>
            )}

            {phase === "feedback" && currentQuestion && config && (
              <div className="space-y-4">
                <div
                  className={`rounded-2xl p-4 text-center ${
                    feedbackType === "correct"
                      ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700"
                      : "bg-rose-50 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-700"
                  }`}
                >
                  {feedbackType === "correct" && (
                    <>
                      <p className="text-4xl font-extrabold text-emerald-700 dark:text-emerald-300">
                        ✓ Correct!
                      </p>
                      {currentQuestion.type === "ipa-to-word" && (
                        <p className="text-4xl font-black text-slate-800 dark:text-[#F7E1A0] mt-2" style={{ fontFamily: "var(--font-mali)" }}>
                          {currentQuestion.word.word}
                        </p>
                      )}
                      {(() => {
                        const w = currentQuestion.word;
                        const hasDiff = w.ipaUs && w.ipaUk && w.ipaUs !== w.ipaUk;
                        const ipa = hasDiff
                          ? `${w.ipaUs} (US)  /  ${w.ipaUk} (UK)`
                          : (w.ipaUs || w.ipaUk || w.ipa);
                        if (!ipa) return null;
                        return (
                          <p className="text-sm font-mono font-bold text-slate-500 dark:text-slate-400 mt-2">
                            {ipa}
                          </p>
                        );
                      })()}
                    </>
                  )}

                  {feedbackType === "wrong" && (
                    <>
                      <p className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
                        {currentQuestion.type === "word-to-ipa"
                          ? `✗ Incorrect — The answer of "${currentQuestion.word.word}" =`
                          : "✗ Incorrect — The answer was:"}
                      </p>
                      {currentQuestion.type === "word-to-ipa" ? (
                        <p className="text-4xl font-black text-slate-800 dark:text-white mt-2" style={{ fontFamily: "var(--font-geist-mono)" }}>
                          /{currentQuestion.word.phonemeIds
                            .map((id) => PHONEMES.find((p) => p.id === id))
                            .filter(Boolean)
                            .map((p) => p!.ipa.replace(/\//g, ""))
                            .join(" ")}/
                        </p>
                      ) : (
                        <p className="text-4xl font-black text-slate-800 dark:text-[#F7E1A0] mt-2" style={{ fontFamily: "var(--font-mali)" }}>
                          {currentQuestion.word.word}
                        </p>
                      )}
                      {(() => {
                        const w = currentQuestion.word;
                        const hasDiff = w.ipaUs && w.ipaUk && w.ipaUs !== w.ipaUk;
                        const ipa = hasDiff
                          ? `${w.ipaUs} (US)  /  ${w.ipaUk} (UK)`
                          : (w.ipaUs || w.ipaUk);
                        if (!ipa) return null;
                        return (
                          <p className="text-sm font-mono font-bold text-slate-500 dark:text-slate-400 mt-2">
                            {ipa}
                          </p>
                        );
                      })()}
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                        {currentQuestion.word.definition || ""}
                      </p>
                    </>
                  )}

                  {feedbackType === "sequence" && (
                    <>
                      <p className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
                        ⚠ Sequence incorrect — Correct:
                      </p>
                      <p className="text-4xl font-black text-slate-800 dark:text-white mt-2" style={{ fontFamily: "var(--font-geist-mono)" }}>
                        /{currentQuestion.word.phonemeIds
                          .map((id) => PHONEMES.find((p) => p.id === id))
                          .filter(Boolean)
                          .map((p) => p!.ipa.replace(/\//g, ""))
                          .join(" ")}/
                      </p>
                      {(() => {
                        const w = currentQuestion.word;
                        const hasDiff = w.ipaUs && w.ipaUk && w.ipaUs !== w.ipaUk;
                        const ipa = hasDiff
                          ? `${w.ipaUs} (US)  /  ${w.ipaUk} (UK)`
                          : (w.ipaUs || w.ipaUk);
                        if (!ipa) return null;
                        return (
                          <p className="text-sm font-mono font-bold text-slate-500 dark:text-slate-400 mt-2">
                            {ipa}
                          </p>
                        );
                      })()}
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                        {currentQuestion.word.definition || ""}
                      </p>
                    </>
                  )}
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C8A44E] to-[#D4B06A] text-white text-xs font-extrabold tracking-wider uppercase shadow-lg hover:shadow-xl hover:from-[#D4B06A] hover:to-[#C8A44E] active:scale-[0.97] transition-all cursor-pointer"
                >
                  {isLastQuestion || (config.mode === "endless" && livesLeft <= 0) || (config.mode === "hardcore" && feedbackType !== "correct")
                    ? "See Results"
                    : "Continue"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {phase === "results" && config && (
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="w-full max-w-sm bg-white/95 dark:bg-slate-900/95 border border-white/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[#C8A44E]/20 flex items-center justify-center mx-auto">
              <i className={`fi fi-sr-${score >= incorrect ? "trophy" : "flag"} text-2xl text-[#C8A44E]`} />
            </div>

            <h2 className="text-lg font-extrabold text-slate-800 dark:text-[#F7E1A0]" style={{ fontFamily: "var(--font-mali)" }}>
              Quiz Complete!
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{score}</p>
                <p className="text-[8px] font-extrabold text-emerald-500/70 uppercase tracking-widest">Correct</p>
              </div>
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 p-3">
                <p className="text-sm font-black text-rose-600 dark:text-rose-400">{incorrect}</p>
                <p className="text-[8px] font-extrabold text-rose-500/70 uppercase tracking-widest">Incorrect</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3">
              <p className="text-lg font-black text-slate-700 dark:text-slate-200">
                {totalQuestions > 0 ? Math.round((score / (score + incorrect)) * 100) : 0}%
              </p>
              <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Accuracy</p>
            </div>

            {bestStreak > 0 && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                Best streak: {bestStreak}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => startQuiz(config)}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#C8A44E] to-[#D4B06A] text-white text-[10px] font-extrabold tracking-wider uppercase shadow-lg hover:shadow-xl active:scale-[0.97] transition-all cursor-pointer"
              >
                Play Again
              </button>
              <button
                onClick={() => setScreen("word-builder")}
                className="flex-1 py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-[10px] font-extrabold tracking-wider uppercase hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-[0.97] transition-all cursor-pointer"
              >
                Word Builder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
