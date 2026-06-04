"use client";

import { useGame } from "../context";
import { t } from "../lang";
import type { Bottleneck } from "../simulation/types";

interface SimTaskManagerProps {
  util: Record<string, number>;
  bottleneck: Bottleneck | null;
  cpuTemp: number;
  swapActive?: boolean;
  diskFull?: boolean;
}

function barColor(v: number): string {
  if (v >= 80) return "bg-red-500";
  if (v >= 50) return "bg-amber-500";
  return "bg-emerald-500";
}

function barColorText(v: number): string {
  if (v >= 80) return "text-red-400";
  if (v >= 50) return "text-amber-400";
  return "text-emerald-400";
}

const BAR_KEYS = ["cpu", "gpu", "ram", "ssd", "hdd"] as const;
const BAR_LABEL_KEYS: Record<string, string> = {
  cpu: "workflow.cpu",
  gpu: "workflow.gpu",
  ram: "workflow.ram",
  ssd: "sim.ssd",
  hdd: "sim.hdd",
};

export default function SimTaskManager({ util, bottleneck, cpuTemp, swapActive, diskFull }: SimTaskManagerProps) {
  const { lang, mode } = useGame();

  return (
    <div className="bg-zinc-900/90 border border-zinc-700 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3 font-bold text-center">
        {t("workflow.taskmanager", lang, mode)}
      </div>

      <div className="space-y-2">
        {BAR_KEYS.map((k) => {
          const val = util[k] ?? 0;
          return (
            <div key={k}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-zinc-400 font-bold">{t(BAR_LABEL_KEYS[k], lang, mode)}</span>
                <span className={barColorText(val)}>{val}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor(val)}`}
                  style={{
                    width: `${val}%`,
                    transition: "width 0.5s ease, background-color 0.3s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Temp */}
      <div className="mt-3 pt-3 border-t border-zinc-700 flex justify-between items-center text-[10px]">
        <span className="text-zinc-500">{t("workflow.temp", lang, mode)}</span>
        <span className={
          cpuTemp >= 80 ? "text-red-400 font-bold" :
          cpuTemp >= 50 ? "text-amber-400" :
          "text-emerald-400"
        }>
          {cpuTemp}°C
        </span>
      </div>

      {/* Swap / Disk Full warnings */}
      {swapActive && (
        <div className="mt-2 pt-2 border-t border-zinc-700">
          <div className="flex items-center gap-1 text-[9px] text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            SWAP (RAM → SSD)
          </div>
          <div className="text-[8px] text-zinc-500 mt-0.5">
            RAM usage &ge; 95% — paging to SSD
          </div>
        </div>
      )}
      {diskFull && (
        <div className="mt-2 pt-2 border-t border-zinc-700">
          <div className="flex items-center gap-1 text-[9px] text-red-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            DISK FULL
          </div>
          <div className="text-[8px] text-zinc-500 mt-0.5">
            Storage at capacity — writes queued
          </div>
        </div>
      )}

      {/* Bottleneck */}
      {bottleneck && (
        <div className="mt-2 pt-2 border-t border-zinc-700">
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">
            Bottleneck
          </div>
          <div className={`text-[10px] font-bold ${
            bottleneck.severity === "severe" ? "text-red-400" :
            bottleneck.severity === "moderate" ? "text-amber-400" :
            "text-yellow-400"
          }`}>
            {(bottleneck.type ?? "unknown").toUpperCase()} ({bottleneck.utilPercent}%)
          </div>
        </div>
      )}
    </div>
  );
}
