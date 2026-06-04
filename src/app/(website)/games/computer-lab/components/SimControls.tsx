"use client";

import { useGame } from "../context";
import { t } from "../lang";
import type { DataSize, ResourceLevel } from "../simulation/types";
import type { Speed } from "../hooks/useSimulationSpeed";
import type { WorkloadType, WorkloadConfig, AppConfig } from "../simulation/workloads";
import SimSettingsPanel from "./SimSettingsPanel";

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
  onUpdateWorkload: (id: string, updates: Partial<WorkloadConfig>) => void;
  runningApps: AppConfig[];
  onToggleApp: (appId: string) => void;
  ramTotal: number;
  ramUsed: number;
  resourceLevel: ResourceLevel;
}

const SPEEDS: Speed[] = [0.25, 0.5, 1, 2, 3];

export default function SimControls({
  onReset, speed, onSpeedChange,
  isPaused, onTogglePause,
  concurrency, onConcurrencyChange,
  dataSize, onDataSizeChange,
  workloads, onAddWorkload, onRemoveWorkload, onUpdateWorkload,
  runningApps, onToggleApp,
  ramTotal, ramUsed, resourceLevel,
}: SimControlsProps) {
  const { lang, mode } = useGame();

  return (
    <div className="bg-zinc-900/90 border border-zinc-700 rounded-xl p-2.5 space-y-2">
      {/* Top bar: Reset + Speed + Pause */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onReset}
          className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 text-[10px] font-bold transition-colors"
          title={t("sim.reset", lang, mode)}
        >
          ↺
        </button>

        <div className="flex gap-0.5 bg-zinc-800 rounded-lg p-0.5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                speed === s
                  ? "bg-amber-600 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <button
          onClick={onTogglePause}
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
            isPaused
              ? "bg-blue-600 text-white"
              : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {isPaused ? "▶" : "⏸"}
        </button>
      </div>

      {/* Settings Panel */}
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
    </div>
  );
}