"use client";

import { useState, useCallback } from "react";
import type { CpuState, GpuState, RamState, StorageState, PsuState, FanState, DataSize, RamType, VramType } from "../simulation/types";

interface UseComponentStateReturn {
  cpuState: CpuState;
  gpuState: GpuState;
  ramState: RamState;
  ssdState: StorageState;
  hddState: StorageState;
  psuState: PsuState;
  fanState: FanState;
  setCpuCores: (n: number) => void;
  setCpuClock: (n: number) => void;
  setGpuCores: (n: number) => void;
  setGpuVram: (n: number) => void;
  setGpuVramType: (t: VramType) => void;
  setGpuLoad: (n: number) => void;
  setRamConfig: (sticks: number, perStickGb: number, type: RamType, mhz: number) => void;
  setSsdConfig: (rwSpeed: number, capacity: number) => void;
  setHddConfig: (rwSpeed: number, capacity: number) => void;
  setFanRpm: (rpm: number) => void;
  isAdvanced: boolean;
  setAdvanced: (v: boolean) => void;
  dataSize: DataSize;
  setDataSize: (s: DataSize) => void;
}

export function useComponentState(): UseComponentStateReturn {
  const [cpuState, setCpuState] = useState<CpuState>({
    cores: 4,
    clock: 3,
    temp: 30,
    tdp: 65,
  });
  const [gpuState, setGpuState] = useState<GpuState>({
    cores: 4,
    vram: 8,
    vramType: "GDDR6",
    load: 5,
    fps: 60,
  });
  const [ramState, setRamState] = useState<RamState>({
    sticks: 2,
    capacityPerStick: 8,
    type: "DDR4",
    speed: 3200,
    usage: 30,
  });
  const [ssdState, setSsdState] = useState<StorageState>({
    rwSpeed: 500,
    capacity: 500,
    usage: 20,
  });
  const [hddState, setHddState] = useState<StorageState>({
    rwSpeed: 100,
    capacity: 1000,
    usage: 40,
  });
  const [psuState] = useState<PsuState>({ wattage: 500, powerDraw: 300 });
  const [fanState, setFanState] = useState<FanState>({ rpm: 50, cfm: 40 });
  const [isAdvanced, setAdvanced] = useState(false);
  const [dataSize, setDataSize] = useState<DataSize>("byte");

  const setCpuCores = useCallback((n: number) => {
    setCpuState((s) => ({ ...s, cores: Math.max(1, Math.min(64, n)) }));
  }, []);

  const setCpuClock = useCallback((n: number) => {
    setCpuState((s) => ({ ...s, clock: Math.max(1, Math.min(6, n)) }));
  }, []);

  const setGpuCores = useCallback((n: number) => {
    setGpuState((s) => ({ ...s, cores: Math.max(1, Math.min(64, n)) }));
  }, []);

  const setGpuVram = useCallback((n: number) => {
    setGpuState((s) => ({ ...s, vram: Math.max(1, Math.min(32, n)) }));
  }, []);

  const setGpuVramType = useCallback((t: VramType) => {
    setGpuState((s) => ({ ...s, vramType: t }));
  }, []);

  const setGpuLoad = useCallback((n: number) => {
    setGpuState((s) => ({ ...s, load: Math.max(1, Math.min(10, n)) }));
  }, []);

  const setRamConfig = useCallback((sticks: number, perStickGb: number, type: RamType, mhz: number) => {
    setRamState({ sticks: Math.max(1, Math.min(4, sticks)), capacityPerStick: perStickGb, type, speed: mhz, usage: 30 });
  }, []);

  const setSsdConfig = useCallback((rwSpeed: number, capacity: number) => {
    setSsdState({ rwSpeed, capacity, usage: 20 });
  }, []);

  const setHddConfig = useCallback((rwSpeed: number, capacity: number) => {
    setHddState({ rwSpeed, capacity, usage: 40 });
  }, []);

  const setFanRpm = useCallback((rpm: number) => {
    setFanState((s) => ({ ...s, rpm: Math.max(0, Math.min(100, rpm)) }));
  }, []);

  return {
    cpuState,
    gpuState,
    ramState,
    ssdState,
    hddState,
    psuState,
    fanState,
    setCpuCores,
    setCpuClock,
    setGpuCores,
    setGpuVram,
    setGpuVramType,
    setGpuLoad,
    setRamConfig,
    setSsdConfig,
    setHddConfig,
    setFanRpm,
    isAdvanced,
    setAdvanced,
    dataSize,
    setDataSize,
  };
}
