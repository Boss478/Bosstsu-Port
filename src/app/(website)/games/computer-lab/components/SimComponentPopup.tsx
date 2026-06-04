"use client";

import { useGame } from "../context";
import { t } from "../lang";
import { SPRITE_MAP } from "../sprites";
import PixelSprite from "./PixelSprite";
import type { CpuState, GpuState, RamState, StorageState, FanState, RamType, VramType } from "../simulation/types";

interface SimComponentPopupProps {
  componentId: string | null;
  cpuState: CpuState;
  gpuState: GpuState;
  ramState: RamState;
  ssdState: StorageState;
  hddState: StorageState;
  fanState: FanState;
  onUpdateCpuCores: (n: number) => void;
  onUpdateCpuClock: (n: number) => void;
  onUpdateGpuCores: (n: number) => void;
  onUpdateGpuVram: (n: number) => void;
  onUpdateGpuVramType: (t: VramType) => void;
  onUpdateGpuLoad: (n: number) => void;
  onUpdateRamConfig: (sticks: number, capacity: number, type: RamType, mhz: number) => void;
  onUpdateSsdConfig: (rw: number, cap: number) => void;
  onUpdateHddConfig: (rw: number, cap: number) => void;
  onUpdateFanRpm: (n: number) => void;
  onClose: () => void;
}

const RAM_CAPACITIES = [1, 2, 4, 8, 16, 32, 64, 128];
const RAM_TYPES: RamType[] = ["DDR3", "DDR4", "DDR5"];
const VRAM_TYPES: VramType[] = ["GDDR5", "GDDR6", "GDDR7"];

export default function SimComponentPopup({
  componentId, cpuState, gpuState, ramState, ssdState, hddState, fanState,
  onUpdateCpuCores, onUpdateCpuClock, onUpdateGpuCores, onUpdateGpuVram,
  onUpdateGpuVramType, onUpdateGpuLoad, onUpdateRamConfig,
  onUpdateSsdConfig, onUpdateHddConfig, onUpdateFanRpm, onClose,
}: SimComponentPopupProps) {
  const { lang, mode, playSfx } = useGame();

  if (!componentId) return null;

  const sprite = SPRITE_MAP[componentId];
  const isAdvanced = true; // Popup always shows advanced controls

  function Slider({ label, value, min, max, step = 1, onChange, unit = "" }: {
    label: string; value: number; min: number; max: number; step?: number;
    onChange: (v: number) => void; unit?: string;
  }) {
    return (
      <div>
        <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
          <span>{label}</span>
          <span className="text-zinc-300 font-mono">{value}{unit}</span>
        </div>
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 accent-emerald-500"
        />
      </div>
    );
  }

  function Select({ label, value, options, onChange }: {
    label: string; value: string; options: string[];
    onChange: (v: string) => void;
  }) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-zinc-400">{label}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-[10px] text-zinc-300 font-mono outline-none"
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  const renderArchitecture = () => {
    switch (componentId) {
      case "cpu":
        return (
          <div className="grid grid-cols-4 gap-1">
            {Array.from({ length: Math.min(cpuState.cores, 16) }, (_, i) => (
              <div key={i} className="w-4 h-4 rounded bg-amber-500/30 border border-amber-500/50 flex items-center justify-center text-[5px] font-mono text-amber-400">
                C{i}
              </div>
            ))}
            {cpuState.cores > 16 && (
              <div className="col-span-4 text-[8px] text-zinc-600 text-center">+{cpuState.cores - 16} more cores</div>
            )}
          </div>
        );
      case "gpu":
        return (
          <div>
            <div className="grid grid-cols-4 gap-1 mb-1">
              {Array.from({ length: Math.min(Math.ceil(gpuState.cores / 4), 8) }, (_, i) => (
                <div key={i} className="h-3 rounded bg-green-500/20 border border-green-500/40 flex items-center justify-center text-[5px] text-green-400">
                  SM{i}
                </div>
              ))}
            </div>
            <div className="text-[8px] text-zinc-600 font-mono">
              VRAM: {gpuState.vram}GB {gpuState.vramType}
            </div>
          </div>
        );
      case "ram":
        return (
          <div className="flex gap-1 justify-center">
            {Array.from({ length: ramState.sticks }, (_, i) => (
              <div
                key={i}
                className="w-6 h-10 rounded-sm border border-cyan-500/50 bg-cyan-500/10 flex flex-col items-center justify-center text-[6px] font-mono"
                style={{
                  opacity: 0.3 + (i + 1) / ramState.sticks * 0.7,
                }}
              >
                <span className="text-cyan-400">{ramState.capacityPerStick}GB</span>
                <div className="w-3 h-1 rounded bg-cyan-500/30 mt-1"
                  style={{ width: `${ramState.usage}%` }}
                />
              </div>
            ))}
          </div>
        );
      case "ssd":
        return (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-4 rounded bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[5px] text-purple-400">
                NAND
              </div>
            ))}
          </div>
        );
      case "hdd":
        return (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-yellow-500/40 relative overflow-hidden">
              <div className="absolute inset-2 rounded-full border border-yellow-500/20" />
              <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-yellow-400/60 origin-bottom"
                style={{ transform: "translate(-50%, -100%) rotate(45deg)" }}
              />
            </div>
          </div>
        );
      case "psu":
        return (
          <div className="flex items-center justify-center gap-2 text-[8px] text-zinc-500 font-mono">
            <div className="flex flex-col items-center">
              <span className="text-amber-400 font-bold">AC</span>
              <span className="text-[6px]">↕</span>
            </div>
            <div className="w-8 h-3 rounded bg-red-500/20 border border-red-500/40 flex items-center justify-center text-[6px] text-red-400">
              DC
            </div>
            <div className="flex flex-col items-center">
              <span className="text-amber-400 font-bold">DC</span>
              <span className="text-[6px]">↕</span>
            </div>
          </div>
        );
      case "fan":
        return (
          <div className="flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full border-2 border-zinc-600 flex items-center justify-center"
              style={{ animation: fanState.rpm > 0 ? `spin-blade ${1.5 / Math.max(fanState.rpm / 50, 0.1)}s linear infinite` : "none" }}
            >
              <div className="w-1.5 h-5 bg-zinc-500 rounded-full" />
            </div>
          </div>
        );
      default:
        return <div className="text-[8px] text-zinc-600 text-center">No architecture view</div>;
    }
  };

  const renderControls = () => {
    switch (componentId) {
      case "cpu":
        return (
          <>
            <Slider label="Cores" value={cpuState.cores} min={1} max={64} onChange={onUpdateCpuCores} />
            <Slider label="Clock" value={cpuState.clock} min={1} max={6} step={0.5} onChange={onUpdateCpuClock} unit=" GHz" />
            <div className="text-[10px] text-zinc-500 mt-1 flex justify-between">
              <span>Temp:</span>
              <span className={cpuState.temp >= 80 ? "text-red-400 font-bold" : "text-zinc-300"}>{cpuState.temp}°C</span>
            </div>
          </>
        );
      case "gpu":
        return (
          <>
            <Slider label="Cores" value={gpuState.cores} min={1} max={64} onChange={onUpdateGpuCores} />
            <Slider label="VRAM" value={gpuState.vram} min={1} max={32} onChange={onUpdateGpuVram} unit=" GB" />
            <Select label="VRAM Type" value={gpuState.vramType} options={VRAM_TYPES} onChange={(v) => onUpdateGpuVramType(v as VramType)} />
            <Slider label="Load" value={gpuState.load} min={1} max={10} onChange={onUpdateGpuLoad} unit="/10" />
            <div className="text-[10px] text-zinc-500 mt-1 flex justify-between">
              <span>FPS:</span>
              <span className="text-emerald-400">{gpuState.fps}</span>
            </div>
          </>
        );
      case "ram":
        return (
          <>
            <Slider label="Sticks" value={ramState.sticks} min={1} max={4} onChange={(n) => onUpdateRamConfig(n, ramState.capacityPerStick, ramState.type, ramState.speed)} />
            <Select label="Per Stick" value={String(ramState.capacityPerStick)} options={RAM_CAPACITIES.map(String)} onChange={(v) => onUpdateRamConfig(ramState.sticks, Number(v), ramState.type, ramState.speed)} />
            <Select label="Type" value={ramState.type} options={RAM_TYPES} onChange={(v) => onUpdateRamConfig(ramState.sticks, ramState.capacityPerStick, v as RamType, ramState.speed)} />
            <Select label="Speed" value={String(ramState.speed)} options={["800", "1066", "1333", "1600", "1866", "2133", "2400", "2666", "2933", "3200", "3600", "4000", "4266", "4800", "5200", "5600", "6000", "6400", "7200", "8000"]} onChange={(v) => onUpdateRamConfig(ramState.sticks, ramState.capacityPerStick, ramState.type, Number(v))} />
          </>
        );
      case "ssd":
        return (
          <>
            <Slider label="Read/Write" value={ssdState.rwSpeed} min={100} max={3500} step={100} onChange={(v) => onUpdateSsdConfig(v, ssdState.capacity)} unit=" MB/s" />
            <Slider label="Capacity" value={ssdState.capacity} min={128} max={2048} step={128} onChange={(v) => onUpdateSsdConfig(ssdState.rwSpeed, v)} unit=" GB" />
          </>
        );
      case "hdd":
        return (
          <>
            <Slider label="Read/Write" value={hddState.rwSpeed} min={20} max={200} step={10} onChange={(v) => onUpdateHddConfig(v, hddState.capacity)} unit=" MB/s" />
            <Slider label="Capacity" value={hddState.capacity} min={250} max={4000} step={250} onChange={(v) => onUpdateHddConfig(hddState.rwSpeed, v)} unit=" GB" />
          </>
        );
      case "fan":
        return (
          <>
            <Slider label="RPM" value={fanState.rpm} min={0} max={100} onChange={onUpdateFanRpm} unit="%" />
            <div className="text-[10px] text-zinc-500 mt-1 flex justify-between">
              <span>Cooling:</span>
              <span className={fanState.rpm >= 70 ? "text-blue-400" : fanState.rpm >= 40 ? "text-zinc-300" : "text-zinc-600"}>
                {fanState.rpm >= 70 ? "High" : fanState.rpm >= 40 ? "Medium" : "Low"}
              </span>
            </div>
          </>
        );
      default:
        return <div className="text-[10px] text-zinc-600 text-center py-4">No adjustments for {componentId}</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-sm w-full mx-3 animate-popup-enter overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b border-zinc-700">
          {sprite && <PixelSprite data={sprite} size={32} className="w-6 h-6" />}
          <span className="text-sm font-bold text-zinc-200 uppercase">{componentId}</span>
          <button onClick={onClose} className="ml-auto text-zinc-500 hover:text-zinc-300 text-xs">✕</button>
        </div>

        <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Architecture visualization */}
          <div className="bg-zinc-800/60 rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">
              Architecture
            </div>
            {renderArchitecture()}
          </div>

          {/* Controls */}
          <div className="bg-zinc-800/60 rounded-lg p-3 space-y-2">
            <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">
              Adjust
            </div>
            {renderControls()}
          </div>
        </div>
      </div>
    </div>
  );
}
