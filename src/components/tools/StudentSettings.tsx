'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDeviceTier } from '@/lib/device-tier-provider';
import { getTierConfig, type Tier, type TierConfig } from '@/lib/device-tier';
import MascotSelector from './mascots/MascotSelector';

type PresetValue = '' | Tier;
type SectionFilter = 'all' | 'display' | 'effects' | 'performance' | 'sound';

const FILTERS: { value: SectionFilter; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'display', label: 'DISPLAY' },
  { value: 'effects', label: 'EFFECTS' },
  { value: 'performance', label: 'PERFORMANCE' },
  { value: 'sound', label: 'SOUND & AUDIO' },
];

const PRESETS: { value: PresetValue; label: string }[] = [
  { value: '', label: 'Auto' },
  { value: 'max', label: 'Max' },
  { value: 'ultra', label: 'Ultra' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'fast', label: 'Fast' },
];

const TIER_LABELS: Record<Tier, string> = {
  max: 'Max', ultra: 'Ultra', high: 'High', medium: 'Medium', low: 'Low', fast: 'Fast',
};

const TIER_SCORES: Record<Tier, number> = {
  max: 100, ultra: 90, high: 75, medium: 50, low: 25, fast: 10,
};

const FPS_OPTIONS = [60, 45, 30, 24, 15, 10];

function computeEffectsLevel(config: TierConfig): number {
  const fields = [config.transitions, config.particles, config.hoverEffects, config.shadows, config.gradients, config.skeleton];
  const on = fields.filter(Boolean).length;
  return Math.round(on / 6 * 100);
}

function applyEffectsLevel(level: number): Partial<TierConfig> {
  return {
    transitions: level >= 25,
    particles: level >= 50,
    hoverEffects: level >= 25,
    shadows: level >= 25,
    gradients: level >= 50,
    skeleton: level >= 25,
  };
}

function blurPercentToPx(pct: number): number {
  if (pct <= 0) return 0;
  if (pct <= 20) return 4;
  if (pct <= 40) return 8;
  if (pct <= 60) return 12;
  if (pct <= 80) return 16;
  return 24;
}

function blurPxToPercent(px: number): number {
  if (px <= 0) return 0;
  if (px <= 4) return 20;
  if (px <= 8) return 40;
  if (px <= 12) return 60;
  if (px <= 16) return 80;
  return 100;
}

interface StudentSettingsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedMascot?: string | null;
  onMascotSelect?: (id: string) => void;
}

export default function StudentSettings({ open: controlledOpen, onOpenChange, selectedMascot, onMascotSelect }: StudentSettingsProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const { tier, forced, config, setForceTier, setCustomConfig } = useDeviceTier();
  const [selectedPreset, setSelectedPreset] = useState<PresetValue>('');
  const [overrides, setOverrides] = useState<Partial<TierConfig>>({});
  const [soundOn, setSoundOn] = useState(true);
  const [soundtrackOn, setSoundtrackOn] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');

  useEffect(() => {
    if (forced) {
      setSelectedPreset(tier);
    } else {
      setSelectedPreset('');
    }
  }, [forced, tier]);

  useEffect(() => {
    setSoundOn(localStorage.getItem('tools_sound') !== 'off');
    setSoundtrackOn(localStorage.getItem('tools_soundtrack') === 'on');
  }, []);

  const effectiveConfig = useMemo(() => {
    if (selectedPreset === '') return config;
    const base = getTierConfig(selectedPreset);
    return { ...base, ...overrides };
  }, [selectedPreset, config, overrides]);

  const isOverridden = (key: keyof TierConfig) => key in overrides;

  const handlePresetChange = useCallback((val: PresetValue) => {
    setSelectedPreset(val);
    setOverrides({});
    if (val === '') {
      setForceTier(undefined);
      setCustomConfig(undefined);
    } else {
      setForceTier(val);
      setCustomConfig(undefined);
    }
  }, [setForceTier, setCustomConfig]);

  const handleSettingChange = useCallback(<K extends keyof TierConfig>(key: K, value: TierConfig[K]) => {
    setOverrides((prev) => {
      const next = { ...prev, [key]: value };
      setCustomConfig(Object.keys(next).length > 0 ? next : undefined);
      return next;
    });
  }, [setCustomConfig]);

  const handleMultiChange = useCallback((patch: Partial<TierConfig>) => {
    setOverrides((prev) => {
      const next = { ...prev, ...patch };
      setCustomConfig(Object.keys(next).length > 0 ? next : undefined);
      return next;
    });
  }, [setCustomConfig]);

  const handleResetOverride = useCallback((key: keyof TierConfig) => {
    setOverrides((prev) => {
      const { [key]: _, ...rest } = prev;
      setCustomConfig(Object.keys(rest).length > 0 ? rest : undefined);
      return rest;
    });
  }, [setCustomConfig]);

  const handleResetMulti = useCallback((keys: (keyof TierConfig)[]) => {
    setOverrides((prev) => {
      const next = { ...prev };
      for (const k of keys) delete next[k];
      setCustomConfig(Object.keys(next).length > 0 ? next : undefined);
      return next;
    });
  }, [setCustomConfig]);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem('tools_sound', next ? 'on' : 'off');
  }, [soundOn]);

  const toggleSoundtrack = useCallback(() => {
    const next = !soundtrackOn;
    setSoundtrackOn(next);
    localStorage.setItem('tools_soundtrack', next ? 'on' : 'off');
  }, [soundtrackOn]);

  const effectsLevel = useMemo(() => {
    if (isOverridden('transitions') || isOverridden('particles') || isOverridden('hoverEffects') || isOverridden('shadows') || isOverridden('gradients') || isOverridden('skeleton')) {
      return computeEffectsLevel(effectiveConfig);
    }
    return computeEffectsLevel(
      selectedPreset === '' ? config : getTierConfig(selectedPreset)
    );
  }, [effectiveConfig, selectedPreset, config]);

  const handleEffectsLevel = useCallback((val: number) => {
    handleMultiChange(applyEffectsLevel(val));
  }, [handleMultiChange]);

  const effectsOverridden = ['transitions', 'particles', 'hoverEffects', 'shadows', 'gradients', 'skeleton'].some((k) => isOverridden(k as keyof TierConfig));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 h-9 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
        aria-label="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-zinc-600 dark:text-zinc-300">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">ตั้งค่า</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[10vh] overflow-y-auto">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm max-h-[75vh] overflow-y-auto overscroll-contain rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-white/60 dark:border-slate-700/50 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-500">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <i className="fi fi-sr-cross text-sm text-zinc-500" />
              </button>
            </div>

            {/* ── Section Filter ── */}
            <div className="flex flex-wrap gap-1.5 pb-1 border-b border-zinc-100 dark:border-slate-700/50">
              {FILTERS.map((f) => {
                const isActive = sectionFilter === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setSectionFilter(f.value)}
                    title={f.label === 'ALL' ? 'Show all settings' : `Show ${f.label} settings only`}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* ── Mascot Selector ── */}
            {sectionFilter === 'all' && onMascotSelect && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Mascot
                </label>
                <div className="max-h-48 overflow-y-auto scrollbar-thin">
                  <MascotSelector selectedId={selectedMascot ?? null} onSelect={(id) => { onMascotSelect(id); setOpen(false); }} />
                </div>
              </div>
            )}

            {/* ── Graphics Presets ── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Graphics Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => {
                  const isActive = selectedPreset === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handlePresetChange(p.value)}
                      title={`Graphics preset: ${p.label === 'Auto' ? 'Auto-detect based on device' : p.label}`}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-slate-700 hover:bg-zinc-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>
                  {selectedPreset === '' ? 'Auto-detected' : 'Preset'}:
                  <span className="font-medium text-zinc-600 dark:text-zinc-300 ml-1 uppercase">{TIER_LABELS[tier]}</span>
                </span>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span>{TIER_SCORES[tier]}%</span>
                {forced && !selectedPreset && <span className="text-amber-500">(forced)</span>}
              </div>
            </div>

            {/* ── Display ── */}
            {(sectionFilter === 'all' || sectionFilter === 'display') && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Display
              </label>
              <div className="space-y-1.5">
                {/* Image Quality */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Image Quality</span>
                    {isOverridden('imageQuality') && (
                      <button
                        onClick={() => handleResetOverride('imageQuality')}
                        title="Reset to preset default"
                        className="text-[10px] text-blue-500 hover:text-blue-600 underline cursor-pointer"
                      >
                        reset
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={15}
                      value={effectiveConfig.imageQuality}
                      onChange={(e) => handleSettingChange('imageQuality', Number(e.target.value) as TierConfig['imageQuality'])}
                      title="Adjust image resolution and detail quality"
                      className="w-24 accent-blue-500"
                    />
                    <span className="text-xs text-zinc-500 w-7 text-right">{effectiveConfig.imageQuality}%</span>
                  </div>
                </div>

                {/* Backdrop Blur */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Backdrop Blur</span>
                    {isOverridden('backdropBlur') && (
                      <button
                        onClick={() => handleResetOverride('backdropBlur')}
                        title="Reset to preset default"
                        className="text-[10px] text-blue-500 hover:text-blue-600 underline cursor-pointer"
                      >
                        reset
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={20}
                      value={blurPxToPercent(effectiveConfig.backdropBlur)}
                      onChange={(e) => handleSettingChange('backdropBlur', blurPercentToPx(Number(e.target.value)) as TierConfig['backdropBlur'])}
                      title="Controls background frosted-glass blur intensity"
                      className="w-24 accent-blue-500"
                    />
                    <span className="text-xs text-zinc-500 w-7 text-right">{blurPxToPercent(effectiveConfig.backdropBlur)}%</span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* ── Effects ── */}
            {(sectionFilter === 'all' || sectionFilter === 'effects') && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Effects
              </label>
              <div className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Effects Level</span>
                    {effectsOverridden && (
                      <button
                        onClick={() => handleResetMulti(['transitions', 'particles', 'hoverEffects', 'shadows', 'gradients', 'skeleton'])}
                        title="Reset all effects to preset default"
                        className="text-[10px] text-blue-500 hover:text-blue-600 underline cursor-pointer"
                      >
                        reset
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={25}
                      value={effectsLevel}
                      onChange={(e) => handleEffectsLevel(Number(e.target.value))}
                      title="Controls visual effects intensity — transitions, particles, hover, shadows, gradients, skeleton loading"
                      className="w-24 accent-blue-500"
                    />
                    <span className="text-xs text-zinc-500 w-7 text-right">{effectsLevel}%</span>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                  <span>Fast</span>
                  <span>Max</span>
                </div>
              </div>
            </div>
            )}

            {/* ── Performance ── */}
            {(sectionFilter === 'all' || sectionFilter === 'performance') && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Performance
              </label>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">FPS</span>
                    {isOverridden('fps') && (
                      <button
                        onClick={() => handleResetOverride('fps')}
                        title="Reset to preset default"
                        className="text-[10px] text-blue-500 hover:text-blue-600 underline cursor-pointer"
                      >
                        reset
                      </button>
                    )}
                  </div>
                  <select
                    value={effectiveConfig.fps}
                    onChange={(e) => handleSettingChange('fps', Number(e.target.value) as TierConfig['fps'])}
                    title="Target frame rate — higher is smoother but uses more battery"
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    {FPS_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f} fps</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Sync Interval</span>
                    {isOverridden('pollIntervalMs') && (
                      <button
                        onClick={() => handleResetOverride('pollIntervalMs')}
                        title="Reset to preset default"
                        className="text-[10px] text-blue-500 hover:text-blue-600 underline cursor-pointer"
                      >
                        reset
                      </button>
                    )}
                  </div>
                  <select
                    value={effectiveConfig.pollIntervalMs}
                    onChange={(e) => handleSettingChange('pollIntervalMs', Number(e.target.value) as TierConfig['pollIntervalMs'])}
                    title="How often the device syncs with the teacher — shorter = more responsive, uses more data"
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <option value={2000}>2s</option>
                    <option value={5000}>5s</option>
                    <option value={8000}>8s</option>
                    <option value={10000}>10s</option>
                    <option value={15000}>15s</option>
                    <option value={20000}>20s</option>
                  </select>
                </div>
              </div>
            </div>
            )}

            {/* ── Sound ── */}
            {(sectionFilter === 'all' || sectionFilter === 'sound') && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                Sound & Audio
              </label>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-slate-900/50">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Sound Effects</span>
                  <div
                    role="checkbox"
                    aria-checked={soundOn}
                    tabIndex={0}
                    onClick={toggleSound}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSound(); }}
                    title="Toggle sound effects on or off"
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${soundOn ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-slate-600'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${soundOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-slate-900/50">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Lo-fi Soundtrack</span>
                  <div
                    role="checkbox"
                    aria-checked={soundtrackOn}
                    tabIndex={0}
                    onClick={toggleSoundtrack}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSoundtrack(); }}
                    title="Toggle background lo-fi study music"
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${soundtrackOn ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-slate-600'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${soundtrackOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* ── Exit ── */}
            <button
              type="button"
              onClick={() => { window.location.href = '/study'; }}
              title="Leave the classroom and return to session list"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium cursor-pointer"
            >
              <i className="fi fi-sr-sign-out-alt text-sm" />
              ออกจากห้องเรียน
            </button>
          </div>
        </div>
      )}
    </>
  );
}
