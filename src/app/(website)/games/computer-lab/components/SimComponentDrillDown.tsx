"use client";

import { useMemo } from "react";
import { useGame } from "../context";
import { t } from "../lang";
import type { CpuState, GpuState, RamState, StorageState } from "../simulation/types";

interface SimComponentDrillDownProps {
  componentId: string;
  cpuState: CpuState;
  gpuState: GpuState;
  ramState: RamState;
  ssdState: StorageState;
  hddState: StorageState;
  onClose: () => void;
}

function Dot({ x, y, color = "#00ff41", size = 4, delay = "0s" }: { x: number; y: number; color?: string; size?: number; delay?: string }) {
  return (
    <circle cx={x} cy={y} r={size} fill={color} opacity={0.8}>
      <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" begin={delay} />
    </circle>
  );
}

function CpuDrillDown({ cores, clock, temp }: { cores: number; clock: number; temp: number }) {
  const cols = useMemo(() => Math.min(Math.ceil(Math.sqrt(cores)), 8), [cores]);
  const rows = useMemo(() => Math.ceil(cores / cols), [cores, cols]);
  const coreSize = 18;
  const gap = 3;
  const startX = 20;
  const startY = 30;
  const l3Y = startY + rows * (coreSize + gap) + 8;

  return (
    <svg viewBox="0 0 260 160" className="w-full h-full">
      {/* Die background */}
      <rect x="5" y="5" width="250" height="150" rx="4" fill="#1a1a2e" stroke="#334155" strokeWidth="1" />

      {/* Title */}
      <text x="130" y="14" textAnchor="middle" fill="#94a3b8" fontSize="6" fontWeight="bold">CPU DIE — {cores}C/{clock}GHz</text>
      <text x="130" y="22" textAnchor="middle" fill={temp >= 80 ? "#ef4444" : "#94a3b8"} fontSize="5">{temp}°C</text>

      {/* L3 cache (shared) */}
      <rect x={startX - 4} y={l3Y} width={cols * (coreSize + gap)} height={8} rx="2" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="0.5" opacity={0.6} />
      <text x={startX - 4 + (cols * (coreSize + gap)) / 2} y={l3Y + 6} textAnchor="middle" fill="#60a5fa" fontSize="4">L3 Cache (Shared)</text>

      {/* Core grid */}
      {Array.from({ length: cores }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = startX + col * (coreSize + gap);
        const cy = startY + row * (coreSize + gap);
        return (
          <g key={i}>
            <rect x={cx} y={cy} width={coreSize} height={coreSize} rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
            {/* L1 */}
            <rect x={cx + 1} y={cy + 1} width={4} height={coreSize - 2} rx="1" fill="#065f46" opacity={0.5} />
            {/* EXEC */}
            <rect x={cx + 6} y={cy + 2} width={6} height={coreSize - 4} rx="1" fill="#1e40af" opacity={0.4} />
            {/* L2 */}
            <rect x={cx + coreSize - 5} y={cy + 1} width={4} height={coreSize - 2} rx="1" fill="#7c3aed" opacity={0.5} />
            <text x={cx + coreSize / 2} y={cy + coreSize / 2 + 1} textAnchor="middle" fill="#94a3b8" fontSize="3">C{i}</text>
            {/* Dot flowing L1→EXEC→L2 */}
            <Dot x={cx + 3} y={cy + coreSize / 2} color="#34d399" size={2} delay={`${i * 0.1}s`} />
          </g>
        );
      })}

      {/* Legend */}
      <g transform="translate(160, 110)">
        <rect x={0} y={0} width={6} height={4} rx="1" fill="#065f46" opacity={0.5} />
        <text x={8} y={4} fill="#64748b" fontSize="3.5">L1</text>
        <rect x={0} y={6} width={6} height={4} rx="1" fill="#1e40af" opacity={0.4} />
        <text x={8} y={10} fill="#64748b" fontSize="3.5">EXEC</text>
        <rect x={0} y={12} width={6} height={4} rx="1" fill="#7c3aed" opacity={0.5} />
        <text x={8} y={16} fill="#64748b" fontSize="3.5">L2</text>
      </g>
    </svg>
  );
}

function GpuDrillDown({ cores, vram }: { cores: number; vram: number }) {
  const smCount = Math.min(Math.ceil(cores / 64), 16);
  const smPerRow = 8;
  const smRows = Math.ceil(smCount / smPerRow);
  const smSize = 14;
  const gap = 3;
  const startX = 20;
  const startY = 40;

  return (
    <svg viewBox="0 0 260 160" className="w-full h-full">
      {/* GPU die */}
      <rect x="5" y="5" width="250" height="150" rx="4" fill="#1a1a2e" stroke="#334155" strokeWidth="1" />

      <text x="130" y="14" textAnchor="middle" fill="#94a3b8" fontSize="6" fontWeight="bold">GPU DIE — {cores} CUDA Cores</text>
      <text x="130" y="22" textAnchor="middle" fill="#94a3b8" fontSize="5">{vram}GB VRAM</text>

      {/* SM array */}
      {Array.from({ length: smCount }).map((_, i) => {
        const col = i % smPerRow;
        const row = Math.floor(i / smPerRow);
        const cx = startX + col * (smSize + gap);
        const cy = startY + row * (smSize + gap);
        return (
          <g key={i}>
            <rect x={cx} y={cy} width={smSize} height={smSize} rx="1.5" fill="#1e1b4b" stroke="#6d28d9" strokeWidth="0.6" />
            <text x={cx + smSize / 2} y={cy + smSize / 2 + 1} textAnchor="middle" fill="#8b5cf6" fontSize="3">SM</text>
            <Dot x={cx + smSize / 2} y={cy + smSize / 2} color="#a78bfa" size={2} delay={`${i * 0.08}s`} />
          </g>
        );
      })}

      {/* VRAM chips */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={startX + i * 20} y={startY + smRows * (smSize + gap) + 6} width={16} height={8} rx="1" fill="#0f172a" stroke="#7c3aed" strokeWidth="0.5" />
          <text x={startX + i * 20 + 8} y={startY + smRows * (smSize + gap) + 11} textAnchor="middle" fill="#6d28d9" fontSize="3">VRAM</text>
        </g>
      ))}
    </svg>
  );
}

function RamDrillDown({ sticks, capacity, speed }: { sticks: number; capacity: number; speed: number }) {
  const dimmW = 40;
  const dimmH = 90;
  const gap = 6;
  const totalW = sticks * dimmW + (sticks - 1) * gap;
  const startX = (260 - totalW) / 2;
  const startY = 35;

  return (
    <svg viewBox="0 0 260 160" className="w-full h-full">
      <rect x="5" y="5" width="250" height="150" rx="4" fill="#1a1a2e" stroke="#334155" strokeWidth="1" />

      <text x="130" y="14" textAnchor="middle" fill="#94a3b8" fontSize="6" fontWeight="bold">RAM — {sticks}×{capacity}GB @ {speed}MHz</text>

      {/* Memory controller */}
      <rect x={110} y={6} width={40} height={16} rx="2" fill="#0f172a" stroke="#3b82f6" strokeWidth="0.8" />
      <text x={130} y={16} textAnchor="middle" fill="#60a5fa" fontSize="4">Memory Ctrl</text>

      {/* DIMM slots */}
      {Array.from({ length: sticks }).map((_, i) => {
        const x = startX + i * (dimmW + gap);
        return (
          <g key={i}>
            <rect x={x} y={startY} width={dimmW} height={dimmH} rx="2" fill="#0f172a" stroke="#059669" strokeWidth="0.8" />
            {/* Chips on DIMM */}
            {[0, 1].map((j) => (
              <rect key={j} x={x + 3} y={startY + 6 + j * 20} width={dimmW - 6} height={16} rx="1" fill="#064e3b" opacity={0.5} stroke="#10b981" strokeWidth="0.3" />
            ))}
            <text x={x + dimmW / 2} y={startY + dimmH - 4} textAnchor="middle" fill="#6ee7b7" fontSize="4">DIMM {i + 1}</text>
            {/* Data flowing through */}
            <Dot x={x + dimmW / 2} y={startY + dimmH / 2} color="#34d399" size={3} delay={`${i * 0.2}s`} />
          </g>
        );
      })}
    </svg>
  );
}

function SsdDrillDown({ rwSpeed, capacity }: { rwSpeed: number; capacity: number }) {
  return (
    <svg viewBox="0 0 260 160" className="w-full h-full">
      <rect x="5" y="5" width="250" height="150" rx="4" fill="#1a1a2e" stroke="#334155" strokeWidth="1" />

      <text x="130" y="14" textAnchor="middle" fill="#94a3b8" fontSize="6" fontWeight="bold">SSD — {rwSpeed}MB/s</text>
      <text x="130" y="22" textAnchor="middle" fill="#94a3b8" fontSize="5">{capacity}GB</text>

      {/* Controller */}
      <rect x={90} y={30} width={80} height={30} rx="3" fill="#0f172a" stroke="#f59e0b" strokeWidth="0.8" />
      <text x={130} y={48} textAnchor="middle" fill="#fbbf24" fontSize="5" fontWeight="bold">Controller</text>

      {/* NAND chips */}
      {[0, 1, 2, 3].map((i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        return (
          <g key={i}>
            <rect x={30 + col * 80} y={68 + row * 30} width={60} height={22} rx="2" fill="#0f172a" stroke="#10b981" strokeWidth="0.6" />
            <text x={60 + col * 80} y={80 + row * 30} textAnchor="middle" fill="#34d399" fontSize="4">NAND {i + 1}</text>
            {/* Animated data flowing to each NAND */}
            <Dot x={90 + col * 80} y={76 + row * 30} color="#34d399" size={2.5} delay={`${i * 0.15}s`} />
            {/* Connection line from controller */}
            <line x1={130} y1={60} x2={90 + col * 80} y2={68 + row * 30} stroke="#f59e0b" strokeWidth="0.5" opacity={0.3} />
          </g>
        );
      })}
    </svg>
  );
}

function HddDrillDown({ rwSpeed, capacity }: { rwSpeed: number; capacity: number }) {
  return (
    <svg viewBox="0 0 260 160" className="w-full h-full">
      <rect x="5" y="5" width="250" height="150" rx="4" fill="#1a1a2e" stroke="#334155" strokeWidth="1" />

      <text x="130" y="14" textAnchor="middle" fill="#94a3b8" fontSize="6" fontWeight="bold">HDD — {rwSpeed}MB/s</text>
      <text x="130" y="22" textAnchor="middle" fill="#94a3b8" fontSize="5">{capacity}GB</text>

      {/* Platter */}
      <defs>
        <radialGradient id="platterGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#1f2937" />
        </radialGradient>
      </defs>

      <circle cx="130" cy="85" r="48" fill="url(#platterGrad)" stroke="#475569" strokeWidth="1" />
      <circle cx="130" cy="85" r="8" fill="#475569" />

      {/* Spinning animation */}
      <g>
        <line x1="130" y1="37" x2="130" y2="133" stroke="#6b7280" strokeWidth="0.3" opacity={0.5}>
          <animateTransform attributeName="transform" type="rotate" from="0 130 85" to="360 130 85" dur="3s" repeatCount="indefinite" />
        </line>
        <line x1="82" y1="85" x2="178" y2="85" stroke="#6b7280" strokeWidth="0.3" opacity={0.5}>
          <animateTransform attributeName="transform" type="rotate" from="0 130 85" to="360 130 85" dur="3s" repeatCount="indefinite" />
        </line>
      </g>

      {/* Read/Write head */}
      <g>
        <rect x="180" y="30" width="4" height="110" rx="1" fill="#4b5563" />
        <rect x="176" y="75" width="8" height="6" rx="1" fill="#f59e0b" opacity={0.8}>
          <animate attributeName="y" values="75;85;75" dur="2s" repeatCount="indefinite" />
        </rect>
        <text x="178" y="146" textAnchor="middle" fill="#f59e0b" fontSize="4">Head</text>
      </g>

      {/* Data dot on platter */}
      <Dot x={150} y={65} color="#34d399" size={3} delay="0s" />
      <Dot x={110} y={100} color="#34d399" size={3} delay="0.5s" />
    </svg>
  );
}

export default function SimComponentDrillDown({ componentId, cpuState, gpuState, ramState, ssdState, hddState, onClose }: SimComponentDrillDownProps) {
  const { lang, mode } = useGame();

  const specLines = useMemo(() => {
    switch (componentId) {
      case "cpu":
        return [
          `${cpuState.cores} Cores`,
          `${cpuState.clock} GHz`,
          `${cpuState.temp}°C`,
          `${cpuState.tdp}W TDP`,
        ];
      case "gpu":
        return [
          `${gpuState.cores} CUDA Cores`,
          `${gpuState.vram}GB ${gpuState.vramType}`,
          `${gpuState.fps} FPS`,
          `Load: ${gpuState.load}%`,
        ];
      case "ram":
        return [
          `${ramState.sticks}×${ramState.capacityPerStick}GB`,
          `${ramState.type} @ ${ramState.speed}MHz`,
          `Usage: ${ramState.usage}%`,
        ];
      case "ssd":
        return [
          `${ssdState.rwSpeed}MB/s R/W`,
          `${ssdState.capacity}GB`,
          `Usage: ${ssdState.usage}%`,
        ];
      case "hdd":
        return [
          `${hddState.rwSpeed}MB/s R/W`,
          `${hddState.capacity}GB`,
          `Usage: ${hddState.usage}%`,
        ];
      default:
        return [];
    }
  }, [componentId, cpuState, gpuState, ramState, ssdState, hddState]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <h3 className="text-sm font-black text-green-400 uppercase tracking-wider">
            {t(`component.${componentId}`, lang, mode) || componentId}
          </h3>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-500 hover:text-red-400 text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* SVG Architecture */}
        <div className="bg-black/40 h-44">
          {componentId === "cpu" && <CpuDrillDown cores={cpuState.cores} clock={cpuState.clock} temp={cpuState.temp} />}
          {componentId === "gpu" && <GpuDrillDown cores={gpuState.cores} vram={gpuState.vram} />}
          {componentId === "ram" && <RamDrillDown sticks={ramState.sticks} capacity={ramState.capacityPerStick} speed={ramState.speed} />}
          {componentId === "ssd" && <SsdDrillDown rwSpeed={ssdState.rwSpeed} capacity={ssdState.capacity} />}
          {componentId === "hdd" && <HddDrillDown rwSpeed={hddState.rwSpeed} capacity={hddState.capacity} />}
        </div>

        {/* Specs footer */}
        <div className="px-4 py-3 border-t border-zinc-700">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {specLines.map((line, i) => (
              <span key={i} className="text-[10px] font-mono text-zinc-400">
                {line}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
