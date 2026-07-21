'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { detectDeviceTier, getTierConfig, type Tier, type TierConfig, type DeviceScore } from '@/lib/device-tier';

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

export function DeviceTierProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [forceTier, setForceTier] = useState<Tier | undefined>(undefined);
  const [customOverrides, setCustomOverrides] = useState<Partial<TierConfig> | undefined>(undefined);
  const [state, setState] = useState<DeviceTierContextValue>({
    tier: 'medium',
    config: getTierConfig('medium'),
    raw: { gpu: 50, cpu: 50, memory: 50, connection: 50 },
    loading: true,
    forced: false,
    setForceTier: () => {},
    setCustomConfig: () => {},
  });

  useEffect(() => {
    if (forceTier) {
      const base = getTierConfig(forceTier);
      setState((prev) => ({
        ...prev,
        tier: forceTier,
        config: customOverrides ? { ...base, ...customOverrides } : base,
        raw: { gpu: 50, cpu: 50, memory: 50, connection: 50 },
        loading: false,
        forced: true,
      }));
      return;
    }

    detectDeviceTier().then((result) => {
      const base = getTierConfig(result.tier);
      setState((prev) => ({
        ...prev,
        tier: result.tier,
        config: customOverrides ? { ...base, ...customOverrides } : base,
        raw: result.raw,
        loading: false,
        forced: false,
      }));
    });
  }, [forceTier, customOverrides]);

  const setForceTierCallback = useCallback((tier: Tier | undefined) => {
    setForceTier(tier);
  }, []);

  const setCustomConfigCallback = useCallback((overrides: Partial<TierConfig> | undefined) => {
    setCustomOverrides(overrides);
  }, []);

  const value: DeviceTierContextValue = {
    ...state,
    setForceTier: setForceTierCallback,
    setCustomConfig: setCustomConfigCallback,
  };

  return (
    <DeviceTierContext.Provider value={value}>
      {children}
    </DeviceTierContext.Provider>
  );
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
