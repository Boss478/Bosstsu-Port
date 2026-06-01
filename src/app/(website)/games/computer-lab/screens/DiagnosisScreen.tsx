"use client";

import { useState, useCallback, useMemo } from "react";
import type { ScreenShellProps } from "../types";
import { useGame } from "../context";
import { t } from "../lang";
import PixelSprite from "../components/PixelSprite";
import { SPRITE_MAP } from "../sprites";

interface Scenario {
  symptomKey: string;
  answerKey: string;
}

const SCENARIOS: Scenario[] = [
  { symptomKey: "diag.symptom1", answerKey: "diag.part.psu" },
  { symptomKey: "diag.symptom2", answerKey: "diag.part.gpu" },
  { symptomKey: "diag.symptom3", answerKey: "diag.part.storage" },
  { symptomKey: "diag.symptom4", answerKey: "diag.part.ram" },
  { symptomKey: "diag.symptom5", answerKey: "diag.part.fan" },
  { symptomKey: "diag.symptom6", answerKey: "diag.part.fan" },
  { symptomKey: "diag.symptom7", answerKey: "diag.part.gpu" },
  { symptomKey: "diag.symptom8", answerKey: "diag.part.keyboard" },
  { symptomKey: "diag.symptom9", answerKey: "diag.part.motherboard" },
  { symptomKey: "diag.symptom10", answerKey: "diag.part.psu" },
  { symptomKey: "diag.symptom11", answerKey: "diag.part.fan" },
  { symptomKey: "diag.symptom12", answerKey: "diag.part.psu" },
  { symptomKey: "diag.symptom13", answerKey: "diag.part.motherboard" },
  { symptomKey: "diag.symptom14", answerKey: "diag.part.motherboard" },
  { symptomKey: "diag.symptom15", answerKey: "diag.part.ram" },
  { symptomKey: "diag.symptom16", answerKey: "diag.part.motherboard" },
  { symptomKey: "diag.symptom17", answerKey: "diag.part.motherboard" },
  { symptomKey: "diag.symptom18", answerKey: "diag.part.monitor" },
  { symptomKey: "diag.symptom19", answerKey: "diag.part.cpu" },
  { symptomKey: "diag.symptom20", answerKey: "diag.part.storage" },
];

const ANSWER_KEYS = [
  "diag.part.psu",
  "diag.part.gpu",
  "diag.part.storage",
  "diag.part.ram",
  "diag.part.fan",
  "diag.part.cpu",
  "diag.part.motherboard",
  "diag.part.monitor",
  "diag.part.keyboard",
  "diag.part.mouse",
];

const TOTAL = SCENARIOS.length;

export default function DiagnosisScreen({ onNavigate }: ScreenShellProps) {
  const { lang, mode, playSfx, onStageComplete } = useGame();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [hints, setHints] = useState(2);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [hintRemovals, setHintRemovals] = useState<Record<number, string[]>>({});

  const scenario = SCENARIOS[currentIndex];

  const visibleAnswers = useMemo(() => {
    const removed = hintRemovals[currentIndex] || [];
    if (removed.length === 0) return ANSWER_KEYS;
    return ANSWER_KEYS.filter((k) => !removed.includes(k));
  }, [currentIndex, hintRemovals]);

  const handleAdvance = useCallback(() => {
    setFeedback(null);
    if (currentIndex < TOTAL - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      const stars = wrongCount <= 2 ? 3 : wrongCount <= 5 ? 2 : 1;
      const score = Math.max(1, TOTAL * 10 - wrongCount * 5);
      playSfx("victory");
      onStageComplete("diagnosis", stars, score);
    }
    setLocked(false);
  }, [currentIndex, wrongCount, playSfx, onStageComplete]);

  const handleAnswer = useCallback(
    (answerKey: string) => {
      if (locked || gameOver) return;

      const isCorrect = answerKey === scenario.answerKey;

      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
        setFeedback("correct");
        playSfx("correct");
      } else {
        const nextLives = lives - 1;
        setLives(nextLives);
        setWrongCount((prev) => prev + 1);
        setFeedback("wrong");
        playSfx("wrong");

        if (nextLives <= 0) {
          setLocked(true);
          setTimeout(() => setGameOver(true), 1500);
          return;
        }
      }

      setLocked(true);
      setTimeout(handleAdvance, isCorrect ? 1000 : 1500);
    },
    [locked, gameOver, scenario, lives, playSfx, handleAdvance],
  );

  const handleHint = useCallback(() => {
    if (hints <= 0 || locked || gameOver) return;

    const alreadyRemoved = hintRemovals[currentIndex] || [];
    const wrongKeys = ANSWER_KEYS.filter(
      (k) => k !== scenario.answerKey && !alreadyRemoved.includes(k),
    );
    if (wrongKeys.length === 0) return;

    const pick = wrongKeys[Math.floor(Math.random() * wrongKeys.length)];
    setHintRemovals((prev) => ({
      ...prev,
      [currentIndex]: [...(prev[currentIndex] || []), pick],
    }));
    setHints((prev) => prev - 1);
    playSfx("click");
  }, [hints, locked, gameOver, currentIndex, scenario, hintRemovals, playSfx]);

  const handleGameOverContinue = useCallback(() => {
    const stars = 1;
    const score = correctCount * 10;
    playSfx("click");
    onStageComplete("diagnosis", stars, score);
  }, [correctCount, playSfx, onStageComplete]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setLives(3);
    setHints(2);
    setCorrectCount(0);
    setWrongCount(0);
    setLocked(false);
    setGameOver(false);
    setFeedback(null);
    setHintRemovals({});
    playSfx("click");
  }, [playSfx]);

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-6 space-y-6">
        <h2 className="text-3xl font-black text-red-500">{t("stage5.gameover", lang, mode)}</h2>

        <div className="w-full max-w-sm bg-zinc-900 rounded-xl border-2 border-red-500/30 p-4 text-center space-y-2">
          <p className="text-zinc-400 text-sm italic">
            &ldquo;{t(scenario.symptomKey, lang, mode)}&rdquo;
          </p>
          <div className="border-t border-zinc-700 pt-2">
            <p className="text-green-400 font-bold text-lg">
              {t(scenario.answerKey, lang, mode)}
            </p>
          </div>
        </div>

        <p className="text-zinc-600 text-sm">
          {lang === "th" ? "ตอบถูก" : "Correct"}: {correctCount}/{TOTAL}
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleGameOverContinue}
            className="px-6 py-3 rounded-xl bg-green-500 text-black font-bold hover:bg-green-400 transition-colors"
          >
            {t("victory.continue", lang, mode)}
          </button>
          <button
            onClick={handleRestart}
            className="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold hover:text-green-400 transition-colors"
          >
            {t("victory.replay", lang, mode)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 space-y-4 min-h-full">
      <h2 className="text-2xl font-black text-green-400">{t("stage5.title", lang, mode)}</h2>
      <p className="text-zinc-500 text-xs text-center max-w-xs">{t("stage5.instruction", lang, mode)}</p>

      <div className="flex items-center justify-between w-full max-w-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`transition-all duration-300 ${i < lives ? "" : "opacity-30"}`}
            >
              <PixelSprite data={SPRITE_MAP.heart} size={16} className="inline-block" />
            </span>
          ))}
        </div>

        <span className="text-zinc-600 text-xs">
          {lang === "th" ? "ข้อ" : "#"}
          {currentIndex + 1}/{TOTAL}
        </span>

        <button
          onClick={handleHint}
          disabled={hints <= 0 || locked}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
            hints > 0 && !locked
              ? "bg-yellow-900/30 text-yellow-500 hover:bg-yellow-900/50 border border-yellow-700/50"
              : "bg-zinc-800/50 text-zinc-700 border border-zinc-800 cursor-default"
          }`}
        >
          <PixelSprite data={SPRITE_MAP.lightbulb} size={16} className="inline-block" />{" "}
          {hints > 0
            ? lang === "th"
              ? `คำใบ้ (${hints})`
              : `Hint (${hints})`
            : lang === "th"
              ? "หมดคำใบ้"
              : "No hints"}
        </button>
      </div>

      <div
        className={`w-full max-w-sm rounded-xl border-2 p-5 min-h-[5rem] flex items-center justify-center transition-all duration-300 ${
          feedback === "correct"
            ? "border-green-500 bg-green-900/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
            : feedback === "wrong"
              ? "border-red-500 bg-red-900/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              : "border-zinc-700 bg-zinc-900"
        }`}
      >
        <div className="text-center space-y-2">
          <p className="text-zinc-400 text-sm italic leading-relaxed">
            &ldquo;{t(scenario.symptomKey, lang, mode)}&rdquo;
          </p>
          {feedback && (
            <p
              className={`text-sm font-bold animate-fadeIn ${
                feedback === "correct" ? "text-green-400" : "text-red-400"
              }`}
            >
              {t(feedback === "correct" ? "stage5.correct" : "stage5.wrong", lang, mode)}
            </p>
          )}
        </div>
      </div>

      <div className="w-full max-w-sm">
        <p className="text-zinc-600 text-xs mb-2 text-center">
          {lang === "th" ? "เลือกชิ้นส่วนที่เสีย:" : "Select the faulty part:"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {visibleAnswers.map((ak) => {
            const isAnswer = ak === scenario.answerKey;
            let btnClass =
              "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200";
            if (feedback === "correct" && isAnswer) {
              btnClass = "border-green-500 bg-green-900/20 text-green-400";
            } else if (feedback === "wrong" && isAnswer) {
              btnClass = "border-green-500 bg-green-900/20 text-green-400";
            }

            return (
              <button
                key={ak}
                onClick={() => handleAnswer(ak)}
                disabled={locked}
                className={`px-3 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${
                  locked ? "opacity-60 cursor-default" : "cursor-pointer"
                } ${btnClass}`}
              >
                {t(ak, lang, mode)}
              </button>
            );
          })}
        </div>
        {(hintRemovals[currentIndex]?.length ?? 0) > 0 && (
          <p className="text-yellow-600 text-[10px] text-center mt-2">
            <PixelSprite data={SPRITE_MAP.lightbulb} size={16} className="inline-block mr-1" />
            {lang === "th"
              ? "คำใบ้: คำตอบผิดถูกซ่อนไปแล้ว"
              : "Hint applied: wrong answers hidden"}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate("menu")}
          className="px-4 py-2 rounded bg-zinc-800 text-zinc-500 hover:text-green-400 text-sm transition-colors"
        >
          ← {t("topbar.back", lang, mode)}
        </button>
        <button
          onClick={handleRestart}
          className="px-4 py-2 rounded bg-zinc-800 text-zinc-500 hover:text-red-400 text-sm transition-colors"
        >
          {t("scenario.restart", lang, mode)}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
