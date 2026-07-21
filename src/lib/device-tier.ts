export type Tier = 'max' | 'ultra' | 'high' | 'medium' | 'low' | 'fast';

export interface TierConfig {
  backdropBlur: number;
  fps: number;
  transitions: boolean;
  pollIntervalMs: number;
  particles: boolean;
  imageQuality: number;
  hoverEffects: boolean;
  debounceMs: number;
  skeleton: boolean;
  shadows: boolean;
  gradients: boolean;
  imageLoading: 'eager' | 'lazy';
}

export const TIER_LEVELS: Record<Tier, number> = {
  max: 100,
  ultra: 90,
  high: 75,
  medium: 50,
  low: 25,
  fast: 10,
};

export const TIER_CONFIGS: Record<Tier, TierConfig> = {
  max: {
    backdropBlur: 24,
    fps: 60,
    transitions: true,
    pollIntervalMs: 5000,
    particles: true,
    imageQuality: 100,
    hoverEffects: true,
    debounceMs: 100,
    skeleton: true,
    shadows: true,
    gradients: true,
    imageLoading: 'eager',
  },
  ultra: {
    backdropBlur: 16,
    fps: 60,
    transitions: true,
    pollIntervalMs: 5000,
    particles: true,
    imageQuality: 90,
    hoverEffects: true,
    debounceMs: 150,
    skeleton: true,
    shadows: true,
    gradients: true,
    imageLoading: 'eager',
  },
  high: {
    backdropBlur: 12,
    fps: 30,
    transitions: true,
    pollIntervalMs: 8000,
    particles: true,
    imageQuality: 75,
    hoverEffects: true,
    debounceMs: 200,
    skeleton: true,
    shadows: true,
    gradients: true,
    imageLoading: 'lazy',
  },
  medium: {
    backdropBlur: 8,
    fps: 30,
    transitions: false,
    pollIntervalMs: 10000,
    particles: false,
    imageQuality: 50,
    hoverEffects: true,
    debounceMs: 300,
    skeleton: true,
    shadows: true,
    gradients: false,
    imageLoading: 'lazy',
  },
  low: {
    backdropBlur: 4,
    fps: 15,
    transitions: false,
    pollIntervalMs: 15000,
    particles: false,
    imageQuality: 25,
    hoverEffects: false,
    debounceMs: 500,
    skeleton: false,
    shadows: false,
    gradients: false,
    imageLoading: 'lazy',
  },
  fast: {
    backdropBlur: 0,
    fps: 10,
    transitions: false,
    pollIntervalMs: 20000,
    particles: false,
    imageQuality: 10,
    hoverEffects: false,
    debounceMs: 800,
    skeleton: false,
    shadows: false,
    gradients: false,
    imageLoading: 'lazy',
  },
};

export interface DeviceScore {
  tier: Tier;
  raw: {
    gpu: number;
    cpu: number;
    memory: number;
    connection: number;
  };
}

const CANVAS_TIMEOUT_MS = 2000;
const BENCHMARK_PIXELS = 200;

function canvasBenchmark(): Promise<number> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = BENCHMARK_PIXELS;
      canvas.height = BENCHMARK_PIXELS;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(25); return; }

      const timeoutId = setTimeout(() => resolve(25), CANVAS_TIMEOUT_MS);
      const start = performance.now();

      for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.arc(
          Math.random() * BENCHMARK_PIXELS,
          Math.random() * BENCHMARK_PIXELS,
          Math.random() * 30 + 5,
          0, Math.PI * 2,
        );
        ctx.fillStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.5)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,0.3)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const elapsed = performance.now() - start;
      clearTimeout(timeoutId);

      if (elapsed <= 50) resolve(100);
      else if (elapsed <= 100) resolve(90);
      else if (elapsed <= 200) resolve(75);
      else if (elapsed <= 500) resolve(50);
      else if (elapsed <= 1000) resolve(25);
      else resolve(10);
    } catch {
      resolve(10);
    }
  });
}

function getNavigatorScores(): { cpu: number; memory: number; connection: number } {
  const nav = navigator as unknown as Record<string, unknown>;
  let cpu = 50;
  let memory = 50;
  let connection = 50;

  const hwConcurrency = navigator.hardwareConcurrency;
  if (hwConcurrency) {
    if (hwConcurrency >= 8) cpu = 100;
    else if (hwConcurrency >= 6) cpu = 90;
    else if (hwConcurrency >= 4) cpu = 75;
    else if (hwConcurrency >= 2) cpu = 50;
    else cpu = 25;
  }

  const deviceMemory = nav.deviceMemory as number | undefined;
  if (deviceMemory !== undefined) {
    if (deviceMemory >= 8) memory = 100;
    else if (deviceMemory >= 6) memory = 90;
    else if (deviceMemory >= 4) memory = 75;
    else if (deviceMemory >= 2) memory = 50;
    else memory = 25;
  } else {
    const gpuGuess = cpu >= 75 ? 75 : cpu >= 50 ? 50 : 25;
    memory = Math.round((cpu + gpuGuess) / 2);
  }

  const conn = (nav.connection || nav.mozConnection || nav.webkitConnection) as
    { effectiveType?: string; downlink?: number } | undefined;
  if (conn) {
    const { effectiveType, downlink } = conn;
    if (effectiveType === '4g' && (downlink ?? 0) >= 10) connection = 100;
    else if (effectiveType === '4g') connection = 75;
    else if (effectiveType === '3g') connection = 50;
    else if (effectiveType === '2g') connection = 25;
    else connection = 10;
  }

  return { cpu, memory, connection };
}

function scoreToTier(score: number): Tier {
  if (score >= 90) return 'max';
  if (score >= 75) return 'ultra';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'fast';
}

export async function detectDeviceTier(): Promise<DeviceScore> {
  const gpuScore = await canvasBenchmark();
  const nav = getNavigatorScores();

  const weights = { gpu: 0.4, cpu: 0.35, memory: 0.15, connection: 0.1 };
  const weighted =
    gpuScore * weights.gpu +
    nav.cpu * weights.cpu +
    nav.memory * weights.memory +
    nav.connection * weights.connection;

  return {
    tier: scoreToTier(weighted),
    raw: { gpu: gpuScore, cpu: nav.cpu, memory: nav.memory, connection: nav.connection },
  };
}

export function getTierConfig(tier: Tier): TierConfig {
  return TIER_CONFIGS[tier];
}
