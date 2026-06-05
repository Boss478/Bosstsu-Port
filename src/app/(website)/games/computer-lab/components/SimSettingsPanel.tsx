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
    <div className="space-y-4">
      {/* Concurrency */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-400 font-bold">{t("settings.concurrency", lang, mode)}</span>
          <span className="text-xs text-amber-400 font-mono font-bold">{concurrency}</span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          value={concurrency}
          onChange={(e) => { playSfx("click"); onConcurrencyChange(Number(e.target.value)); }}
          className="w-full h-2 bg-zinc-900 border border-zinc-800 rounded-sm cursor-pointer accent-amber-500"
        />
      </div>
 
      {/* Apps (Resource Level) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-bold">{t("settings.resource", lang, mode)}</span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-zinc-800 font-mono"
            style={{ backgroundColor: resourceColor + "20", color: resourceColor, borderColor: resourceColor + "40" }}
          >
            {t(resourceLabelKey, lang, mode)} ({ramUsed}MB)
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-0.5">
          {SIM_APPS.map((app) => {
            const sprite = SPRITE_MAP[app.spriteKey];
            const active = runningApps.some((a) => a.id === app.id && a.active);
            return (
              <button
                key={app.id}
                onClick={() => { playSfx("click"); onToggleApp(app.id); }}
                className={`flex items-center gap-2 p-1.5 rounded-sm text-left transition-all border ${
                  active
                    ? "bg-zinc-800/80 border-zinc-500 text-zinc-100 shadow-[inset_0_2px_3px_rgba(0,0,0,0.5)]"
                    : "bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300"
                }`}
              >
                {sprite ? (
                  <PixelSprite data={sprite} size={16} className="w-4 h-4 shrink-0" />
                ) : (
                  <div className="w-4 h-4 shrink-0 bg-zinc-800 border border-zinc-750 rounded-sm" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-extrabold truncate">{t(app.nameKey, lang, mode)}</div>
                  <div className="text-[8px] opacity-60 font-mono leading-none mt-0.5">{app.ramCost}MB</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
 
      {/* Workloads Preset Grid */}
      <div className="space-y-1.5">
        <span className="text-xs text-zinc-400 font-bold block">{t("settings.workload", lang, mode)}</span>
        <div className="grid grid-cols-4 gap-1 pr-0.5">
          {WORKLOAD_PRESETS.map((preset) => {
            const active = workloads.some((w) => w.type === preset.type && w.active);
            return (
              <button
                key={preset.type}
                onClick={() => {
                  playSfx("click");
                  if (active) {
                    const wl = workloads.find((w) => w.type === preset.type && w.active);
                    if (wl) onRemoveWorkload(wl.id);
                  } else {
                    onAddWorkload(preset.type);
                  }
                }}
                className={`text-[8px] font-bold py-1 px-0.5 rounded-sm transition-all border text-center leading-tight ${
                  active
                    ? "text-zinc-100 font-extrabold border-zinc-450"
                    : "text-zinc-500 bg-zinc-900/10 border-zinc-850 hover:border-zinc-700 hover:text-zinc-300"
                }`}
                style={active ? { backgroundColor: preset.color + "25", borderColor: preset.color + "70" } : {}}
              >
                {t(preset.labelKey, lang, mode)}
              </button>
            );
          })}
        </div>
      </div>
 
      {/* Data Size Select */}
      <div className="space-y-1.5">
        <span className="text-xs text-zinc-400 font-bold block">{t("settings.datasize", lang, mode)}</span>
        <div className="flex gap-4">
          {(["byte", "kb", "mb"] as DataSize[]).map((s) => {
            const isSelected = dataSize === s;
            return (
              <label key={s} className="flex items-center gap-1.5 cursor-pointer group select-none">
                <input
                  type="radio"
                  name="datasize"
                  checked={isSelected}
                  onChange={() => { playSfx("click"); onDataSizeChange(s); }}
                  className="accent-amber-500 w-3 h-3 border border-zinc-750 bg-zinc-900 rounded-full"
                />
                <span className={`text-[10px] font-bold uppercase transition-colors ${
                  isSelected ? "text-amber-400 font-extrabold" : "text-zinc-550 group-hover:text-zinc-350"
                }`}>
                  {s}
                </span>
              </label>
            );
          })}
        </div>
      </div>
 
      {/* RAM bar */}
      <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
        <span className="text-[9px] text-zinc-550 font-bold tracking-wide uppercase">{t("workload.ram", lang, mode)}</span>
        <div className="flex-1 h-2 bg-zinc-900 border border-zinc-850 rounded-sm overflow-hidden p-[1px]">
          <div
            className="h-full rounded-xs transition-all"
            style={{
              width: `${Math.min(ramPercent, 100)}%`,
              backgroundColor: ramPercent > 90 ? "#ef4444" : ramPercent > 70 ? "#f59e0b" : "#22c55e",
            }}
          />
        </div>
        <span className="text-[9px] text-zinc-550 font-mono font-bold">{ramUsed}/{ramTotal}MB</span>
      </div>
    </div>
  );
}