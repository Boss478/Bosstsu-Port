"use client";

import { useState, useCallback } from "react";

export type Speed = 0.25 | 0.5 | 1 | 2 | 3;

interface UseSpeedReturn {
  speed: Speed;
  setSpeed: (s: Speed) => void;
  maxConcurrent: number;
  manualConcurrent: number;
  setManualConcurrent: (n: number) => void;
  isPaused: boolean;
  togglePause: () => void;
}

export function useSimulationSpeed(): UseSpeedReturn {
  const [speed, setSpeedState] = useState<Speed>(1);
  const [isPaused, setIsPaused] = useState(false);

  const maxConcurrent = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
  const [manualConcurrent, setManualConcurrent] = useState(maxConcurrent);

  const setSpeed = useCallback((s: Speed) => {
    setSpeedState(s);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  return {
    speed,
    setSpeed,
    maxConcurrent,
    manualConcurrent,
    setManualConcurrent: useCallback((n: number) => setManualConcurrent(Math.max(1, Math.min(100, n))), []),
    isPaused,
    togglePause,
  };
}
