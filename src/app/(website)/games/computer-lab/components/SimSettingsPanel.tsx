"use client";

import { useGame } from "../context";
import { t } from "../lang";
import { SPRITE_MAP } from "../sprites";
import PixelSprite from "./PixelSprite";
import type { DataSize, ResourceLevel } from "../simulation/types";
import type { WorkloadType, WorkloadConfig, AppConfig } from "../simulation/workloads";
import { WORKLOAD_PRESETS, SIM_APPS } from "../simulation/workloads";

interface SimSettingsPanelProps {
  concurrency: number;
  onConcurrencyChange: (n: number) => void;
  workloads: WorkloadConfig[];
  onAddWorkload: (type: WorkloadType) => void;
  onRemoveWorkload: (id: string) => void;
  runningApps: AppConfig[];
  onToggleApp: (appId: string) => void;
  dataSize: DataSize;
  onDataSizeChange: (s: DataSize) => void;
  ramTotal: number;
  ramUsed: number;
  resourceLevel: ResourceLevel;
}

export default function SimSettingsPanel({
  concurrency, onConcurrencyChange,
  workloads, onAddWorkload, onRemoveWorkload,
  runningApps, onToggleApp,
  dataSize, onDataSizeChange,
  ramTotal, ramUsed, resourceLevel,
}: SimSettingsPanelProps) {
  const { lang, mode, playSfx } = useGame();

  const ramPercent = ramTotal > 0 ? Math.round((ramUsed / ramTotal) * 100) : 0;
  const resourceColor = resourceLevel === "heavy" ? "#ef4444" : resourceLevel === "medium" ? "#f59e0b" : "#22c55e";
  const resourceLabelKey = resourceLevel === "heavy" ? "settings.resource.heavy" : resourceLevel === "medium" ? "settings.resource.medium" : "settings.resource.light";

  return (
    <div className="space-y-2">
      {/* Concurrency */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] text-zinc-400 font-bold">{t("settings.concurrency", lang, mode)}</span>
          <span className="text-[9px] text-amber-400 font-mono">{concurrency}</span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          value={concurrency}
          onChange={(e) => { playSfx("click"); onConcurrencyChange(Number(e.target.value)); }}
          className="w-full h-1 appearance-none bg-zinc-700 rounded-full cursor-pointer accent-amber-500"
        />
      </div>

      {/* Apps (Resource) */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[9px] text-zinc-400 font-bold">{t("settings.resource", lang, mode)}</span>
          <span
            className="text-[7px] font-bold px-1 py-0.5 rounded"
            style={{ backgroundColor: resourceColor + "30", color: resourceColor }}
          >
            {t(resourceLabelKey, lang, mode)} ({ramUsed}MB)
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 max-h-28 overflow-y-auto">
          {SIM_APPS.map((app) => {
            const sprite = SPRITE_MAP[app.spriteKey];
            const active = runningApps.some((a) => a.id === app.id && a.active);
            return (
              <button
                key={app.id}
                onClick={() => onToggleApp(app.id)}
                className={`flex items-center gap-1 px-1.5 py-1 rounded text-left transition-all ${
                  active
                    ? "bg-zinc-700/80 border border-zinc-500"
                    : "bg-zinc-800/40 border border-zinc-700/50 hover:border-zinc-500"
                }`}
              >
                {sprite ? (
                  <PixelSprite data={sprite} size={16} className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 shrink-0 bg-zinc-700 rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] text-zinc-300 font-bold truncate">{t(app.nameKey, lang, mode)}</div>
                  <div className="text-[6px] text-zinc-600 font-mono">{app.ramCost}MB</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Workload */}
      <div>
        <span className="text-[9px] text-zinc-400 font-bold block mb-1">{t("settings.workload", lang, mode)}</span>
        <div className="grid grid-cols-4 gap-1 max-h-24 overflow-y-auto">
          {WORKLOAD_PRESETS.map((preset) => {
            const active = workloads.some((w) => w.type === preset.type && w.active);
            return (
              <button
                key={preset.type}
                onClick={() => {
                  if (active) {
                    const wl = workloads.find((w) => w.type === preset.type && w.active);
                    if (wl) onRemoveWorkload(wl.id);
                  } else {
                    onAddWorkload(preset.type);
                  }
                }}
                className={`text-[7px] font-bold px-1 py-1 rounded transition-all ${
                  active
                    ? "text-white border border-zinc-500"
                    : "text-zinc-500 border border-zinc-700/50 hover:border-zinc-500"
                }`}
                style={active ? { backgroundColor: preset.color + "30", borderColor: preset.color + "80" } : {}}
              >
                {t(preset.labelKey, lang, mode)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Size */}
      <div>
        <span className="text-[9px] text-zinc-400 font-bold block mb-1">{t("settings.datasize", lang, mode)}</span>
        <div className="flex gap-2">
          {(["byte", "kb", "mb"] as DataSize[]).map((s) => (
            <label key={s} className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="datasize"
                checked={dataSize === s}
                onChange={() => onDataSizeChange(s)}
                className="accent-amber-500 w-2.5 h-2.5"
              />
              <span className="text-[8px] text-zinc-400 font-bold uppercase">{s}</span>
            </label>
          ))}
        </div>
      </div>

      {/* RAM bar */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-700/50">
        <span className="text-[8px] text-zinc-600 font-bold">{t("workload.ram", lang, mode)}</span>
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(ramPercent, 100)}%`,
              backgroundColor: ramPercent > 90 ? "#ef4444" : ramPercent > 70 ? "#f59e0b" : "#22c55e",
            }}
          />
        </div>
        <span className="text-[8px] text-zinc-500 font-mono">{ramUsed}/{ramTotal}MB</span>
      </div>
    </div>
  );
}