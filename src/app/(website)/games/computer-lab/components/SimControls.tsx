"use client";
 
import { useState } from "react";
import { useGame } from "../context";
import { t } from "../lang";
import type { DataSize, ResourceLevel, CpuState, GpuState, RamState, StorageState } from "../simulation/types";
import type { Speed } from "../hooks/useSimulationSpeed";
import type { WorkloadType, WorkloadConfig, AppConfig } from "../simulation/workloads";
import SimSettingsPanel from "./SimSettingsPanel";
import SimSpecsPanel from "./SimSpecsPanel";
 
interface SimControlsProps {
  onReset: () => void;
  speed: Speed;
  onSpeedChange: (s: Speed) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  concurrency: number;
  onConcurrencyChange: (n: number) => void;
  dataSize: DataSize;
  onDataSizeChange: (s: DataSize) => void;
  workloads: WorkloadConfig[];
  onAddWorkload: (type: WorkloadType) => void;
  onRemoveWorkload: (id: string) => void;
  runningApps: AppConfig[];
  onToggleApp: (appId: string) => void;
  ramTotal: number;
  ramUsed: number;
  resourceLevel: ResourceLevel;
  cpuState: CpuState;
  gpuState: GpuState;
  ramState: RamState;
  ssdState: StorageState;
  hddState: StorageState;
  onUpdateCpuCores: (n: number) => void;
  onUpdateCpuClock: (n: number) => void;
  onUpdateGpuCores: (n: number) => void;
  onUpdateGpuVram: (n: number) => void;
  onUpdateRamConfig: (sticks: number, perStickGb: number) => void;
  onUpdateSsdConfig: (rwSpeed: number, capacity: number) => void;
  onUpdateHddConfig: (rwSpeed: number, capacity: number) => void;
}
 
const SPEEDS: Speed[] = [0.25, 0.5, 1, 2, 3];
 
export default function SimControls({
  onReset, speed, onSpeedChange,
  isPaused, onTogglePause,
  concurrency, onConcurrencyChange,
  dataSize, onDataSizeChange,
  workloads, onAddWorkload, onRemoveWorkload,
  runningApps, onToggleApp,
  ramTotal, ramUsed, resourceLevel,
  cpuState, gpuState, ramState, ssdState, hddState,
  onUpdateCpuCores, onUpdateCpuClock, onUpdateGpuCores, onUpdateGpuVram,
  onUpdateRamConfig, onUpdateSsdConfig, onUpdateHddConfig,
}: SimControlsProps) {
  const { lang, mode, playSfx } = useGame();
  const [activeTab, setActiveTab] = useState<"software" | "hardware">("software");
 
  const handleTabChange = (tab: "software" | "hardware") => {
    playSfx("click");
    setActiveTab(tab);
  };
 
  return (
    <div className="border-4 border-double border-zinc-700 bg-zinc-950/95 shadow-xl rounded-sm overflow-hidden flex flex-col">
      {/* Retro Window Header */}
      <div className="bg-zinc-800 border-b-2 border-zinc-700 px-2.5 py-1 flex items-center justify-between text-[10px] font-bold text-zinc-300 select-none uppercase tracking-wider">
        <span>[ ⚙️ {t("settings.title", lang, mode)} ]</span>
        <div className="flex gap-1">
          <span className="w-3 h-3 flex items-center justify-center bg-zinc-700 border border-zinc-600 rounded-sm text-[8px] hover:bg-zinc-600 cursor-pointer select-none">_</span>
          <span className="w-3 h-3 flex items-center justify-center bg-zinc-700 border border-zinc-600 rounded-sm text-[8px] hover:bg-zinc-600 cursor-pointer select-none">□</span>
          <span className="w-3 h-3 flex items-center justify-center bg-zinc-700 border border-zinc-600 rounded-sm text-[8px] hover:bg-zinc-600 cursor-pointer select-none">X</span>
        </div>
      </div>
 
      {/* Top Bar: Playback Controls (Media Deck Style) */}
      <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {/* Reset Button */}
          <button
            onClick={() => { playSfx("click"); onReset(); }}
            className="w-7 h-7 flex items-center justify-center rounded-sm bg-zinc-800 text-zinc-300 text-xs font-bold transition-all border-t border-l border-zinc-700 border-r-2 border-b-2 border-zinc-950 active:border-t-2 active:border-l-2 active:border-r active:border-b active:border-zinc-950 hover:bg-zinc-750 active:bg-zinc-850"
            title={t("sim.reset", lang, mode)}
          >
            ↺
          </button>
 
          {/* Play/Pause Button */}
          <button
            onClick={() => { playSfx("click"); onTogglePause(); }}
            className={`w-7 h-7 flex items-center justify-center rounded-sm text-xs font-bold transition-all border-t border-l border-r-2 border-b-2 active:border-t-2 active:border-l-2 active:border-r active:border-b ${
              isPaused
                ? "bg-emerald-800/90 text-emerald-300 border-emerald-700 border-r-emerald-950 border-b-emerald-950 active:border-emerald-950 active:bg-emerald-900"
                : "bg-amber-800/90 text-amber-300 border-amber-700 border-r-amber-950 border-b-amber-950 active:border-amber-950 active:bg-amber-900"
            }`}
          >
            {isPaused ? "▶" : "⏸"}
          </button>
        </div>
 
        {/* Speed Selector (Media Console Style) */}
        <div className="flex bg-zinc-950 border border-zinc-800 p-0.5 rounded-sm">
          {SPEEDS.map((s) => {
            const isActive = speed === s;
            return (
              <button
                key={s}
                onClick={() => { playSfx("click"); onSpeedChange(s); }}
                className={`px-2 py-1 text-[10px] font-bold rounded-xs transition-all ${
                  isActive
                    ? "bg-amber-600 text-white shadow-inner font-black"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {s}×
              </button>
            );
          })}
        </div>
      </div>
 
      {/* Tab Selectors */}
      <div className="flex bg-zinc-900 border-b border-zinc-800 px-1 pt-1">
        <button
          onClick={() => handleTabChange("software")}
          className={`px-3 py-1.5 text-xs font-bold rounded-t-sm transition-all select-none border-t border-l border-r ${
            activeTab === "software"
              ? "bg-zinc-950 border-zinc-700 text-amber-400 font-extrabold border-b-transparent translate-y-[1px] z-10"
              : "bg-zinc-900/60 border-zinc-800/40 text-zinc-500 hover:text-zinc-300"
          }`}
        >
          📂 ซอฟต์แวร์ (Software)
        </button>
        <button
          onClick={() => handleTabChange("hardware")}
          className={`px-3 py-1.5 text-xs font-bold rounded-t-sm transition-all select-none border-t border-l border-r ${
            activeTab === "hardware"
              ? "bg-zinc-950 border-zinc-700 text-amber-400 font-extrabold border-b-transparent translate-y-[1px] z-10"
              : "bg-zinc-900/60 border-zinc-800/40 text-zinc-500 hover:text-zinc-300"
          }`}
        >
          🔧 ฮาร์ดแวร์ (Specs)
        </button>
      </div>
 
      {/* Window Body (Displays Active Tab Content) */}
      <div className="p-3 bg-zinc-950 flex-1 overflow-y-auto">
        {activeTab === "software" ? (
          <SimSettingsPanel
            concurrency={concurrency}
            onConcurrencyChange={onConcurrencyChange}
            workloads={workloads}
            onAddWorkload={onAddWorkload}
            onRemoveWorkload={onRemoveWorkload}
            runningApps={runningApps}
            onToggleApp={onToggleApp}
            dataSize={dataSize}
            onDataSizeChange={onDataSizeChange}
            ramTotal={ramTotal}
            ramUsed={ramUsed}
            resourceLevel={resourceLevel}
          />
        ) : (
          <SimSpecsPanel
            cpuState={cpuState}
            gpuState={gpuState}
            ramState={ramState}
            ssdState={ssdState}
            hddState={hddState}
            onUpdateCpuCores={onUpdateCpuCores}
            onUpdateCpuClock={onUpdateCpuClock}
            onUpdateGpuCores={onUpdateGpuCores}
            onUpdateGpuVram={onUpdateGpuVram}
            onUpdateRamConfig={onUpdateRamConfig}
            onUpdateSsdConfig={onUpdateSsdConfig}
            onUpdateHddConfig={onUpdateHddConfig}
          />
        )}
      </div>
    </div>
  );
}