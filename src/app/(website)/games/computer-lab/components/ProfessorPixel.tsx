"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useGame } from "../context";
import PixelSprite from "./PixelSprite";
import {
  PROFESSOR_IDLE,
  PROFESSOR_BLINK,
  PROFESSOR_WAVE,
  PROFESSOR_SIGN,
} from "../sprites";
import type { SpriteData, LabCoatColor, StageId } from "../types";
import { t } from "../lang";
import { saveSave } from "../save";

const COAT_PALETTE: Record<LabCoatColor, number> = {
  white: 2,
  blue: 1,
  green: 7,
  red: 6,
  purple: 10,
  black: 0,
};

const FRAME_DATA: Record<string, SpriteData> = {
  idle: PROFESSOR_IDLE,
  blink: PROFESSOR_BLINK,
  wave: PROFESSOR_WAVE,
  sign: PROFESSOR_SIGN,
};

const SEQUENCE = ["idle", "blink", "idle", "wave", "idle", "sign"] as const;
const FRAME_DURATION = 2500;
const BLINK_DURATION = 300;

const STAGE_ORDER: StageId[] = ["hardware", "software", "workflow", "build", "diagnosis"];

const GENERIC_HINTS: Record<StageId, { th: string; en: string }> = {
  hardware: {
    th: "ลองลากอุปกรณ์ไปยังหมวดที่ถูกต้อง!",
    en: "Try dragging components to the right category!",
  },
  software: {
    th: "แยกแยะระหว่าง OS และ แอปพลิเคชัน!",
    en: "Distinguish between OS and applications!",
  },
  workflow: {
    th: "ดูการทำงานของ CPU, RAM และความจำ!",
    en: "Watch how CPU, RAM, and storage work together!",
  },
  build: {
    th: "ประกอบเครื่องตามตำแหน่งที่ถูกต้อง!",
    en: "Assemble the PC in the correct slots!",
  },
  diagnosis: {
    th: "สังเกตอาการเพื่อหาชิ้นส่วนที่เสีย!",
    en: "Observe symptoms to find the faulty part!",
  },
};

const ALL_COMPLETE_HINT: Record<string, string> = {
  th: "ยินดีด้วย! คุณผ่านทุกด่านแล้ว!",
  en: "Congratulations! All stages complete!",
};

export default function ProfessorPixel() {
  const { save, lang, mode } = useGame();
  const [frame, setFrame] = useState("idle");
  const [showHint, setShowHint] = useState(false);
  const [clicks, setClicks] = useState(save.robotClicks);
  const [spriteSize, setSpriteSize] = useState<number>(64);

  useEffect(() => {
    const check = () => setSpriteSize(window.innerWidth < 640 ? 64 : 96);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    let idx = 0;
    let timerId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = SEQUENCE[idx];
      setFrame(current);
      idx = (idx + 1) % SEQUENCE.length;
      timerId = setTimeout(tick, current === "blink" ? BLINK_DURATION : FRAME_DURATION);
    };

    tick();
    return () => clearTimeout(timerId);
  }, []);

  const professorData = useMemo(() => {
    const base = FRAME_DATA[frame] ?? PROFESSOR_IDLE;
    const coatIdx = COAT_PALETTE[save.labCoatColor];

    if (coatIdx === 2) return base;

    return {
      width: base.width,
      height: base.height,
      pixels: base.pixels.map((row) => row.map((p) => (p === 2 ? coatIdx : p))),
    };
  }, [frame, save.labCoatColor]);

  const handleClick = useCallback(() => {
    const newClicks = clicks + 1;
    setClicks(newClicks);

    const updated = { ...save, robotClicks: newClicks };
    if (newClicks >= 10) {
      updated.pongUnlocked = true;
    }
    saveSave(updated);
  }, [clicks, save]);

  const currentStage = useMemo(() => {
    for (const stageId of STAGE_ORDER) {
      if (!save.progress[stageId]?.completed) return stageId;
    }
    return null;
  }, [save.progress]);

  const hintText = useMemo(() => {
    if (currentStage) {
      const key = `professor_hint_${currentStage}`;
      const translated = t(key, lang, mode);
      if (translated !== key) return translated;
      return GENERIC_HINTS[currentStage]?.[lang] ?? "Keep learning!";
    }
    return ALL_COMPLETE_HINT[lang] ?? "All complete!";
  }, [currentStage, lang, mode]);

  const remaining = Math.max(0, 10 - clicks);
  const progressText = useMemo(() => {
    if (save.pongUnlocked) return t("easter.pong", lang, mode);
    return t("easter.click", lang, mode).replace("{n}", String(remaining));
  }, [save.pongUnlocked, remaining, lang, mode]);

  return (
    <div
      className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2 sm:right-4 sm:left-auto sm:items-end"
      onMouseEnter={() => setShowHint(true)}
      onMouseLeave={() => setShowHint(false)}
    >
      {showHint && (
        <div className="relative mb-1 min-w-[160px] max-w-[220px] rounded-xl border border-white/20 bg-black/70 px-4 py-2.5 text-left backdrop-blur-sm sm:text-right">
          <p className="text-xs leading-snug text-white/90 sm:text-sm">{hintText}</p>
          <p className="mt-1 text-xs text-yellow-400">{progressText}</p>
          <div className="absolute -bottom-2 left-6 h-3 w-3 rotate-45 border-b border-l border-white/20 bg-black/70 sm:right-6 sm:left-auto sm:border-r sm:border-l-0" />
        </div>
      )}

      <button
        type="button"
        onClick={handleClick}
        className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95"
      >
        <PixelSprite data={professorData} size={spriteSize as 64 | 96} />
        {save.pongUnlocked && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
          </span>
        )}
      </button>
    </div>
  );
}
