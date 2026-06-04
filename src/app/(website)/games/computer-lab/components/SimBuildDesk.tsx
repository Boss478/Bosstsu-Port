"use client";

import { useState, useCallback, useRef } from "react";
import { useGame } from "../context";
import { t } from "../lang";
import PixelSprite from "./PixelSprite";
import { SPRITE_MAP } from "../sprites";
import SimDeskView from "./SimDeskView";

type Difficulty = "easy" | "medium" | "hard";

interface PartDef {
  id: string;
  slotId: string;
  langKey: string;
}

interface SimBuildDeskProps {
  difficulty: Difficulty;
  onComplete: (stars: number, score: number) => void;
}

const PARTS: Record<Difficulty, PartDef[]> = {
  easy: [
    { id: "cpu", slotId: "cpu_slot", langKey: "part.cpu" },
    { id: "ram1", slotId: "ram_slot_1", langKey: "part.ramstick" },
    { id: "hdd", slotId: "hdd_bay", langKey: "part.hdd" },
    { id: "psu", slotId: "psu_slot", langKey: "part.psu" },
  ],
  medium: [
    { id: "cpu", slotId: "cpu_slot", langKey: "part.cpu" },
    { id: "ram1", slotId: "ram_slot_1", langKey: "part.ramstick" },
    { id: "hdd", slotId: "hdd_bay", langKey: "part.hdd" },
    { id: "psu", slotId: "psu_slot", langKey: "part.psu" },
    { id: "gpu", slotId: "gpu_slot", langKey: "part.gpu" },
    { id: "fan", slotId: "fan_slot", langKey: "part.fan" },
  ],
  hard: [
    { id: "cpu", slotId: "cpu_slot", langKey: "part.cpu" },
    { id: "ram1", slotId: "ram_slot_1", langKey: "part.ramstick" },
    { id: "ram2", slotId: "ram_slot_2", langKey: "part.ramstick" },
    { id: "hdd", slotId: "hdd_bay", langKey: "part.hdd" },
    { id: "psu", slotId: "psu_slot", langKey: "part.psu" },
    { id: "gpu", slotId: "gpu_slot", langKey: "part.gpu" },
    { id: "fan", slotId: "fan_slot", langKey: "part.fan" },
    { id: "cables", slotId: "cable_slot", langKey: "part.cables" },
  ],
};

const SLOT_LANG: Record<string, string> = {
  cpu_slot: "part.cpu",
  ram_slot_1: "part.ramstick",
  ram_slot_2: "part.ramstick",
  hdd_bay: "part.hdd",
  psu_slot: "part.psu",
  gpu_slot: "part.gpu",
  fan_slot: "part.fan",
  cable_slot: "part.cables",
};

const PART_SPRITE_MAP: Record<string, keyof typeof SPRITE_MAP> = {
  cpu: "cpu", ram1: "ram", ram2: "ram", hdd: "hdd",
  psu: "psu", gpu: "gpu", fan: "fan", cables: "cables",
};

export default function SimBuildDesk({ difficulty, onComplete }: SimBuildDeskProps) {
  const { lang, mode, playSfx } = useGame();
  const parts = PARTS[difficulty];
  const totalParts = parts.length;

  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [placedParts, setPlacedParts] = useState<Set<string>>(new Set());
  const [slotContent, setSlotContent] = useState<Record<string, string>>({});
  const [mistakes, setMistakes] = useState(0);
  const [feedbackSlot, setFeedbackSlot] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [bootPhase, setBootPhase] = useState<"idle" | "booting" | "complete">("idle");
  const [hintText, setHintText] = useState<string | null>(null);

  const clearFeedback = useCallback(() => {
    setFeedbackSlot(null);
    setFeedbackType(null);
    setHintText(null);
  }, []);

  const handlePartClick = useCallback((partId: string) => {
    if (bootPhase !== "idle") return;
    playSfx("click");
    setSelectedPart((prev) => (prev === partId ? null : partId));
    clearFeedback();
  }, [bootPhase, playSfx, clearFeedback]);

  const handleSlotClick = useCallback((slotId: string) => {
    if (!selectedPart || bootPhase !== "idle") return;
    if (slotContent[slotId]) return;

    const currentPart = parts.find((p) => p.id === selectedPart);
    if (!currentPart) return;

    if (currentPart.slotId === slotId) {
      setPlacedParts((prev) => new Set(prev).add(selectedPart));
      setSlotContent((prev) => ({ ...prev, [slotId]: selectedPart }));
      setSelectedPart(null);
      setFeedbackSlot(slotId);
      setFeedbackType("correct");
      playSfx("snap");
      setTimeout(clearFeedback, 600);

      const newCount = placedParts.size + 1;
      if (newCount === totalParts) {
        setTimeout(() => {
          setBootPhase("booting");
          playSfx("boot");
          setTimeout(() => {
            setBootPhase("complete");
            playSfx("victory");
            const stars = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
            const score = Math.max(1, totalParts * 100 - mistakes * 20);
            onComplete(stars, score);
          }, 2500);
        }, 800);
      }
    } else {
      setMistakes((prev) => prev + 1);
      setFeedbackSlot(slotId);
      setFeedbackType("wrong");
      playSfx("wrong");

      const correctPart = parts.find((p) => p.slotId === slotId);
      if (correctPart) {
        setHintText(`${t("stage4.wrong", lang, mode)} — ${t(SLOT_LANG[slotId], lang, mode)} ${lang === "th" ? "ต้องการ" : "needs"} ${t(currentPart.langKey, lang, mode)}`);
      }
      setTimeout(clearFeedback, 800);
    }
  }, [selectedPart, bootPhase, slotContent, parts, placedParts, totalParts, lang, mode, playSfx, clearFeedback, onComplete, mistakes]);

  const activeSlotIds = parts.map((p) => p.slotId);

  return (
    <div className="flex flex-col gap-4">
      {/* Build area — inside PC case */}
      <div className={`bg-zinc-900 border-2 rounded-xl p-4 transition-all duration-700 ${
        bootPhase === "booting" ? "border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]" : "border-zinc-700"
      }`}>
        <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2 font-bold text-center">
          {t("build.case", lang, mode)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {activeSlotIds.map((slotId) => {
            const contentPartId = slotContent[slotId];
            const assignedPart = contentPartId ? parts.find((p) => p.id === contentPartId) : undefined;
            const isFeedbackSlot = feedbackSlot === slotId;
            const isEmpty = !contentPartId;

            let borderClass = isEmpty ? "border-dashed border-zinc-700" : "border-green-600/50";
            let bgClass = isEmpty ? "bg-zinc-800/50" : "bg-zinc-800";
            let glowClass = "";
            let shakeClass = "";

            if (isFeedbackSlot && feedbackType === "correct") {
              glowClass = "shadow-[0_0_15px_rgba(34,197,94,0.5)] border-green-400";
              bgClass = "bg-green-900/30";
            } else if (isFeedbackSlot && feedbackType === "wrong") {
              borderClass = "border-red-500";
              bgClass = "bg-red-900/20";
            }

            if (assignedPart && !isFeedbackSlot) glowClass = "shadow-[0_0_8px_rgba(34,197,94,0.2)]";

            return (
              <button
                key={slotId}
                onClick={() => handleSlotClick(slotId)}
                disabled={!isEmpty || !selectedPart || bootPhase !== "idle"}
                className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${borderClass} ${bgClass} ${glowClass} ${
                  !isEmpty || !selectedPart || bootPhase !== "idle" ? "cursor-default" : "cursor-pointer hover:border-green-600/40"
                }`}
              >
                {assignedPart ? (
                  <>
                    <PixelSprite data={SPRITE_MAP[PART_SPRITE_MAP[assignedPart.id] ?? "cpu"]} size={16} />
                    <span className="text-[10px] text-green-400/80 mt-0.5">{t(assignedPart.langKey, lang, mode)}</span>
                  </>
                ) : (
                  <span className="text-zinc-700 text-[10px] uppercase tracking-wider">{t(SLOT_LANG[slotId], lang, mode)}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Parts tray */}
      <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-3">
        <div className="text-[10px] text-zinc-600 mb-2 text-center">{t("stage4.select", lang, mode)}</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {parts.map((part) => {
            const isSelected = selectedPart === part.id;
            const placed = placedParts.has(part.id);
            return (
              <button
                key={part.id}
                onClick={() => !placed && handlePartClick(part.id)}
                disabled={placed || bootPhase !== "idle"}
                className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all duration-200 ${
                  placed
                    ? "border-green-700/30 bg-green-900/10 text-green-700/40 cursor-default"
                    : isSelected
                      ? "border-green-400 bg-green-900/20 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                      : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 cursor-pointer"
                }`}
              >
                {placed ? (
                  <PixelSprite data={SPRITE_MAP.checkmark} size={16} />
                ) : (
                  <PixelSprite data={SPRITE_MAP[PART_SPRITE_MAP[part.id] ?? "cpu"]} size={16} />
                )}
                <span className="text-[10px] mt-0.5 font-bold">{t(part.langKey, lang, mode)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Boot animation */}
      {bootPhase === "booting" && (
        <div className="flex items-center justify-center gap-2 text-green-400 animate-pulse py-4">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
          <span className="text-sm font-bold">{t("build.boot", lang, mode)}</span>
        </div>
      )}

      {/* Hint */}
      {hintText && <p className="text-xs text-yellow-500 text-center max-w-xs mx-auto animate-fadeIn">{hintText}</p>}

      {/* Progress */}
      <div className="flex justify-center gap-4 text-xs text-zinc-600">
        <span>{placedParts.size}/{totalParts} {lang === "th" ? "ชิ้นส่วน" : "parts"}</span>
        <span>{lang === "th" ? "ผิดพลาด" : "Mistakes"}: {mistakes}</span>
      </div>
    </div>
  );
}
