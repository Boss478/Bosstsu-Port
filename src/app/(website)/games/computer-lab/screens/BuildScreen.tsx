"use client";

import { useState, useCallback, useMemo } from "react";
import type { ScreenShellProps } from "../types";
import { useGame } from "../context";
import { t } from "../lang";
import PixelSprite from "../components/PixelSprite";
import { SPRITE_MAP } from "../sprites";

type Difficulty = "easy" | "medium" | "hard";

interface PartDef {
  id: string;
  slotId: string;
  langKey: string;
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
  cpu: "cpu",
  ram1: "ram",
  ram2: "ram",
  hdd: "hdd",
  psu: "psu",
  gpu: "gpu",
  fan: "fan",
  cables: "cables",
};

function PartDisplay({ partId, size = 16 }: { partId: string; size?: 16 | 32 }) {
  const spriteKey = PART_SPRITE_MAP[partId];
  if (spriteKey) {
    return <PixelSprite data={SPRITE_MAP[spriteKey]} size={size} />;
  }
  return null;
}

export default function BuildScreen({ onNavigate }: ScreenShellProps) {
  const { lang, mode, playSfx, onStageComplete } = useGame();

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [placedParts, setPlacedParts] = useState<Set<string>>(new Set());
  const [slotContent, setSlotContent] = useState<Record<string, string>>({});
  const [mistakes, setMistakes] = useState(0);
  const [feedbackSlot, setFeedbackSlot] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"correct" | "wrong" | null>(null);
  const [bootPhase, setBootPhase] = useState<"idle" | "booting" | "complete">("idle");
  const [hintText, setHintText] = useState<string | null>(null);

  const parts = difficulty ? PARTS[difficulty] : [];
  const totalParts = parts.length;
  const placedCount = placedParts.size;
  const allPlaced = placedCount === totalParts && totalParts > 0;

  const activeSlotIds = useMemo(() => parts.map((p) => p.slotId), [parts]);

  const clearFeedback = useCallback(() => {
    setFeedbackSlot(null);
    setFeedbackType(null);
    setHintText(null);
  }, []);

  const handlePartClick = useCallback((partId: string) => {
    if (bootPhase !== "idle") return;
    setSelectedPart((prev) => (prev === partId ? null : partId));
    clearFeedback();
  }, [bootPhase, clearFeedback]);

  const handleSlotClick = useCallback(
    (slotId: string) => {
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

        const newPlacedCount = placedCount + 1;
        if (newPlacedCount === totalParts) {
          setTimeout(() => {
            setBootPhase("booting");
            playSfx("boot");
            setTimeout(() => {
              setBootPhase("complete");
              playSfx("victory");
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
          setHintText(
            `${t("stage4.wrong", lang, mode)} — ${t(SLOT_LANG[slotId], lang, mode)} ${lang === "th" ? "ต้องการ" : "needs"} ${t(currentPart.langKey, lang, mode)}`
          );
        }
        setTimeout(clearFeedback, 800);
      }
    },
    [selectedPart, bootPhase, slotContent, parts, placedCount, totalParts, lang, mode, playSfx, clearFeedback]
  );

  const handleDifficultySelect = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setSelectedPart(null);
    setPlacedParts(new Set());
    setSlotContent({});
    setMistakes(0);
    setFeedbackSlot(null);
    setFeedbackType(null);
    setBootPhase("idle");
    setHintText(null);
    playSfx("click");
  }, [playSfx]);

  const handleRestart = useCallback(() => {
    setDifficulty(null);
    setSelectedPart(null);
    setPlacedParts(new Set());
    setSlotContent({});
    setMistakes(0);
    setFeedbackSlot(null);
    setFeedbackType(null);
    setBootPhase("idle");
    setHintText(null);
  }, []);

  const isPartPlaced = (partId: string) => placedParts.has(partId);

  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-6 space-y-8">
        <h2 className="text-2xl font-black text-green-400">{t("stage4.title", lang, mode)}</h2>
        <p className="text-zinc-500 text-sm text-center max-w-xs">{t("stage4.instruction", lang, mode)}</p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
            const count = PARTS[d].length;
            const labelKey = `build.difficulty.${d}` as const;
            return (
              <button
                key={d}
                onClick={() => handleDifficultySelect(d)}
                className="w-full px-5 py-4 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-green-500 hover:bg-zinc-800 transition-all text-left"
              >
                <span className="text-green-400 font-bold text-base">{t(labelKey, lang, mode)}</span>
                <span className="text-zinc-600 text-xs block mt-1">
                  {count} {lang === "th" ? "ชิ้นส่วน" : "components"}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onNavigate("menu")}
          className="px-4 py-2 rounded bg-zinc-800 text-zinc-500 hover:text-green-400 text-sm transition-colors"
        >
          ← {t("topbar.back", lang, mode)}
        </button>
      </div>
    );
  }

  if (bootPhase === "complete") {
    const stars = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
    const score = Math.max(1, totalParts * 100 - mistakes * 20);
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-6 space-y-6">
        <div className="mb-4 animate-pulse"><PixelSprite data={SPRITE_MAP.computer} size={96} /></div>
        <h2 className="text-3xl font-black text-green-400">{t("build.complete", lang, mode)}</h2>
        <p className="text-zinc-500 text-sm">{t("stage1.continue", lang, mode)}</p>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <PixelSprite key={i} data={i < stars ? SPRITE_MAP.star_filled : SPRITE_MAP.star_empty} size={64} />
          ))}
        </div>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => onStageComplete("build", stars, score)}
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
      <h2 className="text-2xl font-black text-green-400">{t("stage4.title", lang, mode)}</h2>
      <p className="text-zinc-500 text-xs text-center max-w-xs">{t("stage4.instruction", lang, mode)}</p>

      <div className="flex items-center gap-4 text-xs text-zinc-600">
        <span>
          {placedCount}/{totalParts} {lang === "th" ? "ชิ้นส่วน" : "parts"}
        </span>
        <span>
          {lang === "th" ? "ผิดพลาด" : "Mistakes"}: {mistakes}
        </span>
        <button
          onClick={handleRestart}
          className="text-zinc-600 hover:text-red-400 transition-colors underline"
        >
          {t("scenario.restart", lang, mode)}
        </button>
      </div>

      <div
        className={`w-full max-w-sm rounded-2xl border-2 p-4 transition-all duration-700 ${
          bootPhase === "booting"
            ? "border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
            : "border-zinc-700"
        } bg-zinc-900/80`}
      >
        <p className="text-center text-zinc-600 text-xs mb-3 font-bold uppercase tracking-wider">
          {t("build.case", lang, mode)}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {activeSlotIds.map((slotId) => {
            const contentPartId = slotContent[slotId];
            const assignedPart = contentPartId
              ? parts.find((p) => p.id === contentPartId)
              : undefined;
            const isFeedbackSlot = feedbackSlot === slotId;
            const isEmpty = !contentPartId;

            let borderClass = isEmpty
              ? "border-dashed border-zinc-700"
              : "border-green-600/50";
            let bgClass = isEmpty ? "bg-zinc-800/50" : "bg-zinc-800";
            let glowClass = "";
            let shakeClass = "";

            if (isFeedbackSlot && feedbackType === "correct") {
              glowClass = "shadow-[0_0_15px_rgba(34,197,94,0.5)] border-green-400";
              bgClass = "bg-green-900/30";
            } else if (isFeedbackSlot && feedbackType === "wrong") {
              shakeClass = "animate-shake";
              borderClass = "border-red-500";
              bgClass = "bg-red-900/20";
            }

            if (assignedPart && !isFeedbackSlot) {
              glowClass = "shadow-[0_0_8px_rgba(34,197,94,0.2)]";
            }

            return (
              <button
                key={slotId}
                onClick={() => handleSlotClick(slotId)}
                className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${borderClass} ${bgClass} ${glowClass} ${shakeClass} ${
                  !isEmpty || !selectedPart || bootPhase !== "idle"
                    ? "cursor-default"
                    : "cursor-pointer hover:border-green-600/40"
                }`}
                disabled={!isEmpty || !selectedPart || bootPhase !== "idle"}
              >
                {assignedPart ? (
                  <>
                    <PartDisplay partId={assignedPart.id} size={16} />
                    <span className="text-[10px] text-green-400/80 mt-0.5">
                      {t(assignedPart.langKey, lang, mode)}
                    </span>
                  </>
                ) : (
                  <span className="text-zinc-700 text-[10px] uppercase tracking-wider">
                    {t(SLOT_LANG[slotId], lang, mode)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {bootPhase === "booting" && (
        <div className="flex items-center gap-2 text-green-400 animate-pulse">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
          <span className="text-sm font-bold">{t("build.boot", lang, mode)}</span>
        </div>
      )}

      {hintText && (
        <p className="text-xs text-yellow-500 text-center max-w-xs animate-fadeIn">
          {hintText}
        </p>
      )}

      <div className="w-full max-w-sm">
        <p className="text-zinc-600 text-xs mb-2 text-center">{t("stage4.select", lang, mode)}</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {parts.map((part) => {
            const isSelected = selectedPart === part.id;
            const placed = isPartPlaced(part.id);
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
                <span className="text-xl">{placed ? <PixelSprite data={SPRITE_MAP.checkmark} size={16} /> : <PartDisplay partId={part.id} size={16} />}</span>
                <span className="text-[10px] mt-0.5 font-bold">
                  {t(part.langKey, lang, mode)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
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
