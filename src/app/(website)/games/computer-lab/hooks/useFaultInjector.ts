"use client";

import { useState, useCallback } from "react";
import type { FaultState } from "../simulation/types";

interface UseFaultReturn {
  currentFault: FaultState | null;
  injectFault: (componentId: string, severity: "mild" | "severe") => void;
  clearFault: () => void;
}

const FAULT_DESCRIPTIONS: Record<string, Record<string, string>> = {
  cpu: {
    mild: "CPU is throttling — clock speed reduced to prevent overheating",
    severe: "CPU thermal shutdown imminent — system will freeze",
  },
  gpu: {
    mild: "GPU artifacts detected — screen flickering",
    severe: "GPU driver crashed — display output lost",
  },
  ram: {
    mild: "RAM ECC errors detected — memory instability",
    severe: "RAM module failure — system will blue screen",
  },
  ssd: {
    mild: "SSD wear leveling active — read/write speed reduced",
    severe: "SSD controller failure — data inaccessible",
  },
  hdd: {
    mild: "HDD bad sectors detected — clicking noise",
    severe: "HDD head crash — drive failure imminent",
  },
  fan: {
    mild: "Fan bearing noise — RPM fluctuating",
    severe: "Fan stopped — overheating detected",
  },
  psu: {
    mild: "PSU voltage fluctuation — unstable power delivery",
    severe: "PSU capacitor failure — system will shut down",
  },
  motherboard: {
    mild: "Capacitor swelling detected — minor instability",
    severe: "Motherboard trace crack — system failure",
  },
};

export function useFaultInjector(): UseFaultReturn {
  const [currentFault, setCurrentFault] = useState<FaultState | null>(null);

  const injectFault = useCallback((componentId: string, severity: "mild" | "severe") => {
    const desc = FAULT_DESCRIPTIONS[componentId]?.[severity] ?? "Unknown fault";
    setCurrentFault({
      componentId,
      severity,
      animationKey: `${componentId}_${severity}`,
      description: desc,
    });
  }, []);

  const clearFault = useCallback(() => {
    setCurrentFault(null);
  }, []);

  return {
    currentFault,
    injectFault,
    clearFault,
  };
}
