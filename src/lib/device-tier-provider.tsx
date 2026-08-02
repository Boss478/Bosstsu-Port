'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  detectDeviceTier,
  getTierConfig,
  type Tier,
  type TierConfig,
  type DeviceScore,
} from '@/lib/device-tier';

interface DeviceTierContextValue {
  tier: Tier;
  config: TierConfig;
  raw: DeviceScore['raw'];
  loading: boolean;
  forced: boolean;
  setForceTier: (tier: Tier | undefined) => void;
  setCustomConfig: (overrides: Partial<TierConfig> | undefined) => void;
}

const DeviceTierContext = createContext<DeviceTierContextValue | null>(null);

export function DeviceTierProvider({ children }: { children: ReactNode }) {
  const [forceTier, setForceTier] = useState<Tier | undefined>(undefined);
  const [customOverrides, setCustomOverrides] = useState<Partial<TierConfig> | undefined>(
    undefined,
  );
  const [detected, setDetected] = useState<{ tier: Tier; raw: DeviceScore['raw'] } | null>(null);

  useEffect(() => {
    if (forceTier) return;
    let cancelled = false;
    detectDeviceTier().then((result) => {
      if (!cancelled) setDetected({ tier: result.tier, raw: result.raw });
    });
    return () => {
      cancelled = true;
    };
  }, [forceTier, customOverrides]);

  const setForceTierCallback = useCallback((tier: Tier | undefined) => {
    setForceTier(tier);
  }, []);

  const setCustomConfigCallback = useCallback((overrides: Partial<TierConfig> | undefined) => {
    setCustomOverrides(overrides);
  }, []);

  const tier = forceTier ?? detected?.tier ?? 'medium';
  const raw = forceTier
    ? { gpu: 50, cpu: 50, memory: 50, connection: 50 }
    : (detected?.raw ?? { gpu: 50, cpu: 50, memory: 50, connection: 50 });
  const config = customOverrides
    ? { ...getTierConfig(tier), ...customOverrides }
    : getTierConfig(tier);
  const loading = !forceTier && !detected;
  const forced = !!forceTier;

  const value: DeviceTierContextValue = {
    tier,
    config,
    raw,
    loading,
    forced,
    setForceTier: setForceTierCallback,
    setCustomConfig: setCustomConfigCallback,
  };

  return <DeviceTierContext.Provider value={value}>{children}</DeviceTierContext.Provider>;
}

export function useDeviceTier(): DeviceTierContextValue {
  const ctx = useContext(DeviceTierContext);
  if (!ctx) {
    return {
      tier: 'medium',
      config: getTierConfig('medium'),
      raw: { gpu: 50, cpu: 50, memory: 50, connection: 50 },
      loading: false,
      forced: false,
      setForceTier: () => {},
      setCustomConfig: () => {},
    };
  }
  return ctx;
}
