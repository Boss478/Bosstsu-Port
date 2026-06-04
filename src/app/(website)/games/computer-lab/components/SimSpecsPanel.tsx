"use client";

import { useCallback } from "react";
import { useGame } from "../context";
import { t } from "../lang";
import type { CpuState, GpuState, RamState, StorageState } from "../simulation/types";

interface SimSpecsPanelProps {
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

function SpecSlider({ label, value, min, max, step, onChange, unit }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div className="mb-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[8px] text-zinc-400 font-bold">{label}</span>
        <span className="text-[8px] text-amber-400 font-mono">{value}{unit || ""}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 appearance-none bg-zinc-700 rounded-full cursor-pointer accent-amber-500"
      />
    </div>
  );
}

const STICK_OPTIONS = [1, 2, 4];

export default function SimSpecsPanel({
  cpuState, gpuState, ramState, ssdState, hddState,
  onUpdateCpuCores, onUpdateCpuClock, onUpdateGpuCores, onUpdateGpuVram,
  onUpdateRamConfig, onUpdateSsdConfig, onUpdateHddConfig,
}: SimSpecsPanelProps) {
  const { lang, mode } = useGame();
  const playSfx = useGame().playSfx;

  const handleRamSticks = useCallback((sticks: number) => {
    playSfx("click");
    onUpdateRamConfig(sticks, ramState.capacityPerStick);
  }, [playSfx, onUpdateRamConfig, ramState.capacityPerStick]);

  const handleRamCapacity = useCallback((gb: number) => {
    playSfx("click");
    onUpdateRamConfig(ramState.sticks, gb);
  }, [playSfx, onUpdateRamConfig, ramState.sticks]);

  return (
    <div className="bg-zinc-900/90 border border-zinc-700 rounded-xl p-3">
      <div className="text-[10px] font-bold text-zinc-300 mb-2">{t("specs.title", lang, mode)}</div>
      <SpecSlider label={t("specs.cpu.cores", lang, mode)} value={cpuState.cores} min={1} max={16} step={1} onChange={onUpdateCpuCores} />
      <SpecSlider label={t("specs.cpu.clock", lang, mode)} value={cpuState.clock} min={0.5} max={6} step={0.5} onChange={onUpdateCpuClock} unit="GHz" />
      <div className="mb-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[8px] text-zinc-400 font-bold">{t("specs.ram.sticks", lang, mode)}</span>
          <span className="text-[8px] text-amber-400 font-mono">{ramState.sticks}</span>
        </div>
        <div className="flex gap-1">
          {STICK_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleRamSticks(s)}
              className={`flex-1 text-[8px] font-bold py-1 rounded transition-all ${
                ramState.sticks === s
                  ? "bg-amber-600 text-white"
                  : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <SpecSlider label={t("specs.ram.capacity", lang, mode)} value={ramState.capacityPerStick} min={1} max={64} step={1} onChange={handleRamCapacity} unit="GB" />
      <SpecSlider label={t("specs.gpu.cores", lang, mode)} value={gpuState.cores} min={1} max={64} step={1} onChange={onUpdateGpuCores} />
      <SpecSlider label={t("specs.gpu.vram", lang, mode)} value={gpuState.vram} min={1} max={32} step={1} onChange={onUpdateGpuVram} unit="GB" />
      <SpecSlider label={t("specs.ssd.read", lang, mode)} value={ssdState.rwSpeed} min={50} max={7000} step={50} onChange={(v) => onUpdateSsdConfig(v, ssdState.capacity)} unit="MB/s" />
      <SpecSlider label={t("specs.hdd.read", lang, mode)} value={hddState.rwSpeed} min={10} max={300} step={10} onChange={(v) => onUpdateHddConfig(v, hddState.capacity)} unit="MB/s" />
    </div>
  );
}