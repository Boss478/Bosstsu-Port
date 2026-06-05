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
 
  // Determine if there is a bottleneck and select the appropriate educational tip key
  let tipKey = "";
  if (bottleneck) {
    if (bottleneck.type === "thermal") {
      tipKey = "tip.thermal";
    } else if (bottleneck.type === "cpu") {
      tipKey = "tip.cpu";
    } else if (bottleneck.type === "ram") {
      tipKey = "tip.ram";
    } else if (bottleneck.type === "gpu") {
      tipKey = "tip.gpu";
    } else if (bottleneck.type === "storage_io") {
      tipKey = "tip.storage_io";
    }
  }
 
  return (
    <div className="border-4 border-double border-zinc-700 bg-zinc-950/95 shadow-xl rounded-sm overflow-hidden flex flex-col">
      {/* Retro Window Header */}
      <div className="bg-zinc-800 border-b-2 border-zinc-700 px-2.5 py-1 flex items-center justify-between text-[10px] font-bold text-zinc-300 select-none uppercase tracking-wider">
        <span>[ 📊 {t("workflow.taskmanager", lang, mode)} ]</span>
        <div className="flex gap-1">
          <span className="w-3 h-3 flex items-center justify-center bg-zinc-700 border border-zinc-600 rounded-sm text-[8px] hover:bg-zinc-600 cursor-pointer select-none">_</span>
          <span className="w-3 h-3 flex items-center justify-center bg-zinc-700 border border-zinc-600 rounded-sm text-[8px] hover:bg-zinc-600 cursor-pointer select-none">□</span>
          <span className="w-3 h-3 flex items-center justify-center bg-zinc-700 border border-zinc-600 rounded-sm text-[8px] hover:bg-zinc-600 cursor-pointer select-none">X</span>
        </div>
      </div>
 
      {/* Window Content */}
      <div className="p-3 space-y-3">
        {/* Progress Bars */}
        <div className="space-y-2">
          {BAR_KEYS.map((k) => {
            const val = util[k] ?? 0;
            return (
              <div key={k} className="space-y-0.5">
                <div className="flex justify-between text-xs font-bold items-center">
                  <span className="text-zinc-400">{t(BAR_LABEL_KEYS[k], lang, mode)}</span>
                  <span className={`${barColorText(val)} font-mono`}>{val}%</span>
                </div>
                <div className="h-2.5 bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden p-[1px]">
                  <div
                    className={`h-full rounded-xs transition-all ${barColor(val)}`}
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
 
        {/* Telemetry Footer */}
        <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-xs">
          <span className="text-zinc-500 font-bold">{t("workflow.temp", lang, mode)}</span>
          <span className={`font-mono font-bold ${
            cpuTemp >= 80 ? "text-red-400" :
            cpuTemp >= 50 ? "text-amber-400" :
            "text-emerald-400"
          }`}>
            {cpuTemp}°C
          </span>
        </div>
 
        {/* Swap / Disk Full warnings */}
        {swapActive && (
          <div className="mt-2 pt-2 border-t border-zinc-800 animate-pulse">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
              SWAP ACTIVE (RAM → SSD)
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 leading-normal">
              RAM usage &ge; 95% — paging memory to SSD storage.
            </div>
          </div>
        )}
        {diskFull && (
          <div className="mt-2 pt-2 border-t border-zinc-800 animate-pulse">
            <div className="flex items-center gap-1.5 text-xs text-red-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_6px_#ef4444]" />
              DISK FULL WARNING
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 leading-normal">
              Storage capacity reached — write operations are queued.
            </div>
          </div>
        )}
 
        {/* Bottleneck Display & Educational Insights */}
        {bottleneck && (
          <div className="mt-2.5 pt-2.5 border-t border-zinc-800 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
              <span>Bottleneck Detector</span>
              <span className={`px-1 py-0.5 rounded text-[8px] ${
                bottleneck.severity === "severe" ? "bg-red-500/20 text-red-400 border border-red-500/35 animate-pulse" :
                bottleneck.severity === "moderate" ? "bg-amber-500/20 text-amber-400 border border-amber-500/35" :
                "bg-yellow-500/20 text-yellow-400 border border-yellow-500/35"
              }`}>
                {bottleneck.severity.toUpperCase()}
              </span>
            </div>
            <div className="text-xs font-bold text-zinc-300">
              ⚡ {(bottleneck.type ?? "unknown").toUpperCase()} ({bottleneck.utilPercent}%)
            </div>
 
            {/* Bilingual Educational Tip */}
            {tipKey && (
              <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/35 rounded-sm text-[10px] text-zinc-300 leading-relaxed font-sans shadow-inner">
                <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1 uppercase tracking-wide">
                  <span>💡 {t("tip.title", lang, mode)}</span>
                </div>
                <div>{t(tipKey, lang, mode)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
