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
  const { playSfx } = useGame();
 
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-zinc-400 font-bold">{label}</span>
        <span className="text-amber-400 font-mono font-bold">{value}{unit || ""}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          onChange(Number(e.target.value));
        }}
        onMouseUp={() => playSfx("click")}
        onTouchEnd={() => playSfx("click")}
        className="w-full h-2 bg-zinc-900 border border-zinc-800 rounded-sm cursor-pointer accent-amber-500"
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
    <div className="space-y-4">
      {/* CPU Cores & Clock */}
      <SpecSlider label={t("specs.cpu.cores", lang, mode)} value={cpuState.cores} min={1} max={16} step={1} onChange={onUpdateCpuCores} />
      <SpecSlider label={t("specs.cpu.clock", lang, mode)} value={cpuState.clock} min={0.5} max={6} step={0.5} onChange={onUpdateCpuClock} unit="GHz" />
 
      {/* RAM Configuration */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 font-bold">{t("specs.ram.sticks", lang, mode)}</span>
          <span className="text-amber-400 font-mono font-bold">{ramState.sticks}</span>
        </div>
        <div className="flex gap-1.5">
          {STICK_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleRamSticks(s)}
              className={`flex-1 text-[10px] font-bold py-1.5 rounded-sm transition-all border ${
                ramState.sticks === s
                  ? "bg-zinc-800 border-zinc-500 text-zinc-100 shadow-[inset_0_2px_3px_rgba(0,0,0,0.5)] font-extrabold"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <SpecSlider label={t("specs.ram.capacity", lang, mode)} value={ramState.capacityPerStick} min={1} max={64} step={1} onChange={handleRamCapacity} unit="GB" />
 
      {/* GPU Cores & VRAM */}
      <SpecSlider label={t("specs.gpu.cores", lang, mode)} value={gpuState.cores} min={1} max={64} step={1} onChange={onUpdateGpuCores} />
      <SpecSlider label={t("specs.gpu.vram", lang, mode)} value={gpuState.vram} min={1} max={32} step={1} onChange={onUpdateGpuVram} unit="GB" />
 
      {/* Storage SSD / HDD speeds */}
      <SpecSlider label={t("specs.ssd.read", lang, mode)} value={ssdState.rwSpeed} min={50} max={7000} step={50} onChange={(v) => onUpdateSsdConfig(v, ssdState.capacity)} unit="MB/s" />
      <SpecSlider label={t("specs.hdd.read", lang, mode)} value={hddState.rwSpeed} min={10} max={300} step={10} onChange={(v) => onUpdateHddConfig(v, hddState.capacity)} unit="MB/s" />
    </div>
  );
}