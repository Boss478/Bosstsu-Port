"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { ScreenShellProps } from "../types";
import { useGame } from "../context";
import { t } from "../lang";
import PixelSprite from "../components/PixelSprite";
import SimDeskView from "../components/SimDeskView";
import { SPRITE_MAP } from "../sprites";

interface ComponentDef {
  id: string;
  nameKey: string;
  category: string;
  spriteKey: keyof typeof SPRITE_MAP;
}

const COMPONENTS: ComponentDef[] = [
  { id: "keyboard", nameKey: "hw.keyboard", category: "input", spriteKey: "keyboard" },
  { id: "mouse", nameKey: "hw.mouse", category: "input", spriteKey: "mouse" },
  { id: "microphone", nameKey: "hw.mic", category: "input", spriteKey: "microphone" },
  { id: "scanner", nameKey: "hw.scanner", category: "input", spriteKey: "scanner" },
  { id: "webcam", nameKey: "hw.webcam", category: "input", spriteKey: "webcam" },
  { id: "joystick", nameKey: "hw.joystick", category: "input", spriteKey: "joystick" },
  { id: "monitor", nameKey: "hw.monitor", category: "output", spriteKey: "monitor" },
  { id: "printer", nameKey: "hw.printer", category: "output", spriteKey: "printer" },
  { id: "speaker", nameKey: "hw.speaker", category: "output", spriteKey: "speaker" },
  { id: "projector", nameKey: "hw.projector", category: "output", spriteKey: "projector" },
  { id: "headphones", nameKey: "hw.headphones", category: "output", spriteKey: "headphones" },
  { id: "robot_arm", nameKey: "hw.robotarm", category: "output", spriteKey: "robot_arm" },
  { id: "cpu", nameKey: "hw.cpu", category: "processing", spriteKey: "cpu" },
  { id: "gpu", nameKey: "hw.gpu", category: "processing", spriteKey: "gpu" },
  { id: "motherboard", nameKey: "hw.motherboard", category: "processing", spriteKey: "motherboard" },
  { id: "ram_stick", nameKey: "hw.ram", category: "storage", spriteKey: "ram" },
  { id: "hdd", nameKey: "hw.hdd", category: "storage", spriteKey: "hdd" },
  { id: "ssd", nameKey: "hw.ssd", category: "storage", spriteKey: "ssd" },
  { id: "usb_drive", nameKey: "hw.usb", category: "storage", spriteKey: "usb_drive" },
  { id: "sd_card", nameKey: "hw.sd", category: "storage", spriteKey: "sd_card" },
];

const CATEGORIES = [
  { id: "input", key: "hardware.input" },
  { id: "output", key: "hardware.output" },
  { id: "processing", key: "hardware.processing" },
  { id: "storage", key: "hardware.storage" },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function HardwareScreen({ onNavigate }: ScreenShellProps) {
  const { lang, mode, playSfx, onStageComplete } = useGame();

  const [spriteSize, setSpriteSize] = useState<128 | 256>(128);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setSpriteSize(e.matches ? 256 : 128);
    };
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const shuffled = useMemo(() => shuffle(COMPONENTS), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const current = shuffled[currentIndex];
  const total = shuffled.length;

  const handleCategoryPick = useCallback(
    (categoryId: string) => {
      if (feedback) return;

      const isCorrect = categoryId === current.category;
      const newMistakes = mistakes + (isCorrect ? 0 : 1);

      if (isCorrect) {
        playSfx("correct");
        setFeedback("correct");
      } else {
        playSfx("wrong");
        setFeedback("wrong");
      }

      setMistakes(newMistakes);

      setTimeout(() => {
        setFeedback(null);
        const nextIdx = currentIndex + 1;
        if (nextIdx >= total) {
          const stars = newMistakes === 0 ? 3 : newMistakes <= 3 ? 2 : 1;
          const score = Math.max(0, total - newMistakes);
          onStageComplete("hardware", stars, score);
          onNavigate("victory");
        } else {
          setCurrentIndex(nextIdx);
        }
      }, 800);
    },
    [current, currentIndex, total, mistakes, feedback, playSfx, onStageComplete, onNavigate],
  );

  if (!current) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <p className="text-zinc-500">{t("loading", lang, mode)}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-3 py-2 z-10">
        <h2 className="text-lg sm:text-xl font-black text-green-400">{t("stage1.title", lang, mode)}</h2>
        <button onClick={() => onNavigate("menu")} className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-green-400 text-[10px] transition-colors">
          {t("topbar.back", lang, mode)}
        </button>
      </div>

      <div className="flex-1 px-3 pb-3 overflow-y-auto z-10 space-y-3">
        <div className="opacity-30 mb-4 pointer-events-none">
          <SimDeskView />
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-zinc-600">
          <span>{currentIndex + 1} / {total}</span>
          {mistakes > 0 && <span className="text-red-400">✗ {mistakes}</span>}
        </div>

        <div className="flex flex-col items-center space-y-3">
          <PixelSprite data={SPRITE_MAP[current.spriteKey]} size={spriteSize} />
          <p className="text-xl font-bold text-amber-400">{t(current.nameKey, lang, mode)}</p>
        </div>

        <p className="text-xs text-zinc-600 text-center -mt-2">{t("stage1.instruction.tap", lang, mode)}</p>

        {feedback && (
          <div className={`text-lg font-bold animate-pulse text-center ${
            feedback === "correct" ? "text-green-400" : "text-red-400"
          }`}>
            {feedback === "correct" ? t("stage1.correct", lang, mode) : t("stage1.wrong", lang, mode)}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-sm mx-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryPick(cat.id)}
              disabled={!!feedback}
              className="px-4 py-6 rounded-xl bg-zinc-900/80 backdrop-blur-sm border-2 border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 transition-all text-sm font-bold text-zinc-400 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t(cat.key, lang, mode)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
