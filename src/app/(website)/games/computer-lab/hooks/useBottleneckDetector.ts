"use client";

import { useMemo } from "react";
import type { Bottleneck, CpuState, GpuState, RamState, StorageState } from "../simulation/types";

interface UseBottleneckProps {
  cpuState: CpuState;
  gpuState: GpuState;
  ramState: RamState;
  ssdState: StorageState;
  hddState: StorageState;
  cpuTemp?: number;
}

interface UseBottleneckReturn {
  bottleneck: Bottleneck | null;
  componentUtilization: Record<string, number>;
}

function computeUtilization(
  cpuState: CpuState,
  gpuState: GpuState,
  ramState: RamState,
  ssdState: StorageState,
  hddState: StorageState,
): Record<string, number> {
  const cpuUtil = Math.min(100, Math.round((cpuState.cores * cpuState.clock * 2.5) / 30 * 100));
  const gpuUtil = Math.min(100, Math.round((gpuState.load * gpuState.cores) / 64 * 100));
  const ramUtil = ramState.usage;
  const ssdUtil = ssdState.usage;
  const hddUtil = hddState.usage;

  return {
    cpu: cpuUtil,
    gpu: gpuUtil,
    ram: ramUtil,
    ssd: ssdUtil,
    hdd: hddUtil,
  };
}

function detectBottleneck(util: Record<string, number>, cpuTemp: number): Bottleneck | null {
  if (cpuTemp > 85) {
    return { type: "thermal", severity: "severe", utilPercent: cpuTemp };
  }

  const threshold = 85;
  const entries = Object.entries(util).filter(([k]) => k !== "hdd");
  const high = entries.filter(([, v]) => v >= threshold);
  const low = entries.filter(([, v]) => v < 50);

  if (high.length === 1 && low.length >= 2) {
    const [comp, val] = high[0];
    const severity = val >= 95 ? "severe" : val >= 80 ? "moderate" : "mild";
    return {
      type: comp === "ssd" || comp === "hdd" ? "storage_io" : (comp as "cpu" | "gpu" | "ram"),
      severity,
      utilPercent: val,
    };
  }

  const maxComp = entries.reduce((a, b) => (a[1] > b[1] ? a : b));
  if (maxComp[1] >= threshold) {
    const comp = maxComp[0];
    return {
      type: comp === "ssd" || comp === "hdd" ? "storage_io" : (comp as "cpu" | "gpu" | "ram"),
      severity: maxComp[1] >= 95 ? "severe" : "moderate",
      utilPercent: maxComp[1],
    };
  }

  return null;
}

export function useBottleneckDetector({
  cpuState,
  gpuState,
  ramState,
  ssdState,
  hddState,
  cpuTemp,
}: UseBottleneckProps): UseBottleneckReturn {
  const util = useMemo(
    () => computeUtilization(cpuState, gpuState, ramState, ssdState, hddState),
    [cpuState, gpuState, ramState, ssdState, hddState],
  );

  const bottleneck = useMemo(
    () => detectBottleneck(util, cpuTemp ?? cpuState.temp),
    [util, cpuTemp, cpuState.temp],
  );

  return { bottleneck, componentUtilization: util };
}
