'use client';

import { useGame } from '../context';
import { useMemo, useState } from 'react';
import type { CompanionId, AchievementId, SaveData } from '../types';
import { COMPANIONS, CEFR_LEVEL_LABELS, CEFR_LEVEL_ORDER } from '../constants';
import { useAudio } from '@/hooks/useAudio';
import MascotCanvas from '../components/MascotCanvas';
import AchievementBadge from '../components/AchievementBadge';
import PhonemeHeatmap from '../components/PhonemeHeatmap';
import CefrProgress from '../components/CefrProgress';
import StreakSparkline from '../components/StreakSparkline';

const FREE_IDS: CompanionId[] = ['nox', 'mira', 'chip'];

const ACHIEVEMENT_CATEGORIES: { key: string; label: string; ids: AchievementId[] }[] = [
  {
    key: 'progress',
    label: 'Progress',
    ids: [
      'first_round',
      'sound_explorer',
      'vocab_master',
      'perfectionist',
      'streak_10',
      'streak_30',
    ],
  },
  {
    key: 'phoneme',
    label: 'Phoneme Mastery',
    ids: ['phoneme_10', 'phoneme_25', 'phoneme_40', 'phoneme_gold', 'phoneme_allgold'],
  },
  { key: 'economy', label: 'Economy', ids: ['first_purchase', 'collector_5', 'millionaire'] },
  {
    key: 'skill',
    label: 'Skill',
    ids: ['speed_demon', 'word_builder', 'quiz_champ', 'companion_friend'],
  },
  {
    key: 'challenge',
    label: 'Challenge',
    ids: [
      'match_10',
      'sort_50',
      'rhyme_20',
      'speed_spell_30',
      'syllable_50',
      'challenge_all',
      'challenge_allgold',
    ],
  },
];

function AchievementsSection({ save }: { save: SaveData | null }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const totalUnlocked = save
    ? Object.values(save.achievements).filter((a) => (a as { unlocked: boolean }).unlocked).length
    : 0;
  const total = ACHIEVEMENT_CATEGORIES.reduce((sum, cat) => sum + cat.ids.length, 0);

  if (!save) return null;

  return (
    <div className="glass-panel p-5 rounded-3xl border border-white/30 dark:border-slate-800 shadow-xs text-left mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2"
          style={{ fontFamily: 'var(--font-mali)' }}
        >
          <i className="fi fi-sr-trophy text-amber-500" />
          Achievements
        </h2>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {totalUnlocked}/{total}
        </span>
      </div>

      <div className="space-y-3">
        {ACHIEVEMENT_CATEGORIES.map((cat) => {
          const unlockedCount = cat.ids.filter(
            (id) => (save.achievements[id] as { unlocked?: boolean })?.unlocked,
          ).length;
          const isCollapsed = collapsed[cat.key] ?? unlockedCount === 0;

          return (
            <div key={cat.key}>
              <button
                className="flex items-center justify-between w-full text-left py-1.5 cursor-pointer"
                onClick={() => setCollapsed((p) => ({ ...p, [cat.key]: !isCollapsed }))}
              >
                <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <i
                    className={`fi fi-sr-angle-${isCollapsed ? 'right' : 'down'} text-[10px] text-slate-400 transition-transform`}
                  />
                  {cat.label}
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    ({unlockedCount}/{cat.ids.length})
                  </span>
                </span>
              </button>

              {!isCollapsed && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
                  {cat.ids.map((id) => {
                    const record = save.achievements[id];
                    if (!record) return null;
                    return <AchievementBadge key={id} id={id} record={record} />;
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalUnlocked === total && (
        <div className="mt-4 p-3 rounded-2xl bg-amber-400/10 border border-amber-300/30 text-center">
          <p
            className="text-xs font-bold text-amber-600 dark:text-amber-400"
            style={{ fontFamily: 'var(--font-mali)' }}
          >
            <i className="fi fi-sr-sparkles mr-1" /> All achievements unlocked! You&apos;re a true
            Phonics Master!
          </p>
        </div>
      )}
    </div>
  );
}

export default function ProfileScreen() {
  const {
    save,
    persistSave,
    companion,
    setCompanion,
    setTab,
    activeSlot,
    setScreen,
    deleteSaveSlot,
  } = useGame();
  const { playSound } = useAudio();
  const [lockedClickId, setLockedClickId] = useState<CompanionId | null>(null);
  const [justBought, setJustBought] = useState<CompanionId | null>(null);
  const [isChangingLevel, setIsChangingLevel] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCompanionModal, setShowCompanionModal] = useState(false);

  const unlockedCompanions = useMemo(
    () => save?.unlockedCompanions ?? FREE_IDS,
    [save?.unlockedCompanions],
  );

  const isGuest = !save;

  const sortedCompanions = useMemo(() => {
    const all = Object.values(COMPANIONS) as {
      id: CompanionId;
      name: string;
      type: string;
      cost: number;
    }[];
    return [...all].sort((a, b) => {
      const aFree = a.cost === 0;
      const bFree = b.cost === 0;
      if (aFree && !bFree) return -1;
      if (!aFree && bFree) return 1;
      const aOwned = unlockedCompanions.includes(a.id);
      const bOwned = unlockedCompanions.includes(b.id);
      if (aOwned && !bOwned) return -1;
      if (!aOwned && bOwned) return 1;
      return a.cost - b.cost;
    });
  }, [unlockedCompanions]);

  const visibleCompanions = useMemo(
    () => (isGuest ? sortedCompanions.filter((c) => c.cost === 0) : sortedCompanions),
    [isGuest, sortedCompanions],
  );

  const handleCompanionSelect = (id: CompanionId) => {
    setCompanion(id);
    if (save) {
      persistSave({
        ...save,
        companion: id,
      });
    }
  };

  const handleBuyCompanion = (id: CompanionId) => {
    if (!save) return;
    const data = COMPANIONS[id];
    if (!data) return;
    if (save.phonemeCoins < data.cost) return;
    const updated = {
      ...save,
      phonemeCoins: save.phonemeCoins - data.cost,
      unlockedCompanions: [...unlockedCompanions, id],
    };
    persistSave(updated);
    playSound('tada');
    setLockedClickId(null);
    setJustBought(id);
  };

  const handleSelectAfterBuy = (id: CompanionId) => {
    setCompanion(id);
    if (save) {
      persistSave({ ...save, companion: id });
    }
    setJustBought(null);
  };

  const selectedCompanionData = lockedClickId ? COMPANIONS[lockedClickId] : null;
  const justBoughtData = justBought ? COMPANIONS[justBought] : null;
  const canAfford = selectedCompanionData
    ? (save?.phonemeCoins ?? 0) >= selectedCompanionData.cost
    : false;

  const unlockedSkins = useMemo(() => save?.unlockedItems ?? [], [save?.unlockedItems]);
  const itemsCount = unlockedSkins.length;

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain bg-transparent min-h-full">
      <div className="max-w-md mx-auto px-6 py-8 pb-36 text-center">
        {/* Companion Avatar Circle */}
        {save && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowCompanionModal(true)}
              className="relative group cursor-pointer"
              title="Click to change companion"
            >
              <MascotCanvas
                companionId={companion}
                size={96}
                className="rounded-full bg-white/20 dark:bg-slate-900/30 p-2 border-2 border-[#C8A44E]/50 shadow-md transition-transform group-hover:scale-105"
              />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#C8A44E] text-white flex items-center justify-center text-xs font-bold shadow-md">
                <i className="fi fi-sr-edit" />
              </div>
            </button>
          </div>
        )}

        {/* Title */}
        <div className="mb-6">
          <h1
            className="text-2xl font-extrabold text-slate-800 dark:text-[#F7E1A0] tracking-wide"
            style={{ fontFamily: 'var(--font-mali)' }}
          >
            Adventurer Profile
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
            Your Statistics & Companions
          </p>
        </div>

        {/* Profile Stats Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/30 dark:border-slate-800 shadow-xs text-left mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#C8A44E]/10 to-[#2EC4B6]/10 rounded-bl-full pointer-events-none" />
          <h2
            className="text-xl font-black text-slate-800 dark:text-white mb-4"
            style={{ fontFamily: 'var(--font-mali)' }}
          >
            {save?.name ?? 'Guest Player'}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Total XP
              </span>
              <span className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-1.5 mt-0.5">
                <i className="fi fi-sr-star text-amber-500 text-base" />{' '}
                {(save?.totalCorrects ?? 0) * 10} XP
              </span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Best Streak
              </span>
              <span className="text-lg font-black text-[#FFBA08] flex items-center gap-1.5 mt-0.5">
                <i className="fi fi-sr-flame text-orange-500 text-base" /> {save?.bestStreak ?? 0}{' '}
                Days
              </span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Lessons Played
              </span>
              <span className="text-lg font-black text-[#2EC4B6] flex items-center gap-1.5 mt-0.5">
                <i className="fi fi-sr-clipboard-list-check text-slate-400 text-base" />{' '}
                {save?.totalRoundsPlayed ?? 0} rounds
              </span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Items Unlocked
              </span>
              <span className="text-lg font-black text-[#9B59B6] flex items-center gap-1.5 mt-0.5">
                <i className="fi fi-sr-shopping-cart text-[#9B59B6] text-base" /> {itemsCount} items
              </span>
            </div>

            <div className="col-span-2 border-t border-slate-200/50 dark:border-slate-800/60 pt-4 mt-2">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                English level (CEFR)
              </span>
              <div className="flex items-center justify-between mt-1">
                <span
                  className="text-base font-black text-[#C8A44E] flex items-center gap-1.5"
                  style={{ fontFamily: 'var(--font-mali)' }}
                >
                  <i className="fi fi-sr-graduation-cap text-[#C8A44E] text-base" />{' '}
                  {CEFR_LEVEL_LABELS[save?.cefrLevel ?? 'a1']}
                </span>
                {!isGuest && (
                  <button
                    className="px-3 py-1.5 rounded-xl bg-[#C8A44E]/10 border border-[#C8A44E]/20 text-[#C8A44E] text-[10px] font-black tracking-widest uppercase hover:bg-[#C8A44E]/20 active:scale-95 transition-all cursor-pointer"
                    onClick={() => setIsChangingLevel(true)}
                  >
                    Change Level
                  </button>
                )}
              </div>
            </div>

            {!isGuest && (
              <div className="col-span-2 border-t border-slate-200/50 dark:border-slate-800/60 pt-4 mt-2 flex gap-2">
                <button
                  className="flex-1 px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black tracking-widest uppercase hover:bg-white/80 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                  onClick={() => {
                    setRenameValue(save?.name ?? '');
                    setShowRename(true);
                  }}
                >
                  <i className="fi fi-sr-pencil mr-1" /> Rename
                </button>
                <button
                  className="flex-1 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-500 text-[10px] font-black tracking-widest uppercase hover:bg-rose-100 dark:hover:bg-rose-950/40 active:scale-95 transition-all cursor-pointer"
                  onClick={() => setConfirmDelete(true)}
                >
                  <i className="fi fi-sr-trash mr-1" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Skins Details panel */}
        {itemsCount > 0 && (
          <div className="glass-panel p-4 rounded-2xl border border-white/20 text-left mb-4">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
              Unlocked Customizations
            </span>
            <div className="flex flex-wrap gap-2">
              {unlockedSkins.map((skinId) => (
                <span
                  key={skinId}
                  className="inline-block px-3 py-1 rounded-xl bg-slate-200/50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-300/30 capitalize"
                >
                  ⭐ {skinId.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Section */}
        <AchievementsSection save={save} />

        {/* Progress Section */}
        {save && (
          <div className="glass-panel p-5 rounded-3xl border border-white/30 dark:border-slate-800 shadow-xs text-left mb-4 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <i className="fi fi-sr-chart-line text-indigo-400 text-sm" />
              <h2
                className="text-lg font-black text-slate-800 dark:text-white"
                style={{ fontFamily: 'var(--font-mali)' }}
              >
                Progress Reports
              </h2>
            </div>

            <PhonemeHeatmap save={save} />

            <hr className="border-slate-200/30 dark:border-slate-800/40" />

            <CefrProgress save={save} />

            <hr className="border-slate-200/30 dark:border-slate-800/40" />

            <StreakSparkline
              bestStreak={save.bestStreak}
              currentStreak={save.currentStreak}
              totalRounds={save.totalRoundsPlayed}
            />
          </div>
        )}
      </div>

      {/* Companion Selection Modal */}
      {showCompanionModal && save && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowCompanionModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <h3
                className="text-lg font-bold text-slate-800 dark:text-white"
                style={{ fontFamily: 'var(--font-mali)' }}
              >
                Choose Companion
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {visibleCompanions.map((comp) => (
                <div
                  key={comp.id}
                  className={`glass-panel p-3 rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all relative ${
                    companion === comp.id
                      ? 'border-[#C8A44E] ring-4 ring-[#C8A44E]/10 scale-[1.02] shadow-md'
                      : 'border-white/20 hover:scale-[1.01]'
                  }`}
                  onClick={() => {
                    if (unlockedCompanions.includes(comp.id)) {
                      handleCompanionSelect(comp.id);
                      setShowCompanionModal(false);
                    } else {
                      setLockedClickId(comp.id);
                      setShowCompanionModal(false);
                    }
                  }}
                >
                  <MascotCanvas
                    companionId={comp.id}
                    size={48}
                    className="rounded-2xl bg-white/20 dark:bg-slate-900/30 p-1.5 border border-white/30 dark:border-slate-800 shadow-sm"
                  />
                  <span
                    className="text-xs font-extrabold text-slate-800 dark:text-slate-100 mt-1.5 block"
                    style={{ fontFamily: 'var(--font-mali)' }}
                  >
                    {comp.name}
                  </span>
                  {!unlockedCompanions.includes(comp.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 dark:bg-black/60 rounded-2xl">
                      <i className="fi fi-sr-lock text-lg text-white drop-shadow-lg" />
                    </div>
                  )}
                  {companion === comp.id && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center text-[9px] bg-[#C8A44E] text-white rounded-full shadow-md font-bold">
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <button
                className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs tracking-wider uppercase hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                onClick={() => setShowCompanionModal(false)}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Modal */}
      {selectedCompanionData && !justBought && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setLockedClickId(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-72 shadow-2xl border border-white/20 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <i className="fi fi-sr-lock text-3xl text-slate-400 mb-2 block" />
              <h3
                className="text-lg font-bold text-slate-800 dark:text-white"
                style={{ fontFamily: 'var(--font-mali)' }}
              >
                {selectedCompanionData.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">
                {selectedCompanionData.type}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8A44E]/10 text-[#C8A44E] text-sm font-extrabold">
                <i className="fi fi-sr-wallet text-xs" /> {selectedCompanionData.cost} coins
              </div>
            </div>
            <div className="space-y-2">
              {canAfford ? (
                <button
                  className="w-full py-3 rounded-xl font-extrabold text-sm tracking-wider bg-[#C8A44E] text-white hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                  onClick={() => handleBuyCompanion(selectedCompanionData.id)}
                >
                  <i className="fi fi-sr-shopping-cart mr-1.5" /> Buy Now
                </button>
              ) : (
                <div className="w-full py-3 rounded-xl font-bold text-xs text-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  Not enough coins! Play more lessons.
                </div>
              )}
              <button
                className="w-full py-2.5 rounded-xl font-bold text-xs tracking-wider bg-[#2EC4B6] text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                onClick={() => {
                  setLockedClickId(null);
                  setTab('shop');
                }}
              >
                <i className="fi fi-sr-shop mr-1.5" /> Go to Bazaar
              </button>
              <button
                className="w-full py-2 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
                onClick={() => setLockedClickId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-purchase "Ask to select" Modal */}
      {justBoughtData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-72 shadow-2xl border border-white/20 dark:border-slate-700">
            <div className="text-center mb-4">
              <i className="fi fi-sr-sparkles text-3xl text-[#C8A44E] mb-2 block" />
              <h3
                className="text-lg font-bold text-slate-800 dark:text-white"
                style={{ fontFamily: 'var(--font-mali)' }}
              >
                {justBoughtData.name} Unlocked!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select as active companion?
              </p>
            </div>
            <div className="space-y-2">
              <button
                className="w-full py-3 rounded-xl font-extrabold text-sm tracking-wider bg-[#C8A44E] text-white hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                onClick={() => handleSelectAfterBuy(justBoughtData.id)}
              >
                Yes, select {justBoughtData.name}
              </button>
              <button
                className="w-full py-2 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
                onClick={() => setJustBought(null)}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Slot Modal */}
      {showRename && save && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowRename(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-80 shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <i className="fi fi-sr-pencil text-3xl text-[#C8A44E] mb-2 block" />
              <h3
                className="text-lg font-bold text-slate-800 dark:text-white"
                style={{ fontFamily: 'var(--font-mali)' }}
              >
                Rename Profile
              </h3>
            </div>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value.slice(0, 16))}
              placeholder="Enter new name..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A44E] mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 font-bold text-xs tracking-wider uppercase hover:bg-white/90 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                onClick={() => setShowRename(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-3 rounded-2xl bg-[#C8A44E] text-white font-bold text-xs tracking-wider uppercase hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                onClick={() => {
                  if (renameValue.trim()) {
                    persistSave({ ...save, name: renameValue.trim() });
                    setShowRename(false);
                    playSound('correct');
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && save && typeof activeSlot === 'number' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-80 shadow-2xl border border-slate-200 dark:border-slate-800 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mx-auto mb-4">
              <i className="fi fi-sr-exclamation" />
            </div>
            <h3
              className="text-lg font-bold text-slate-800 dark:text-white"
              style={{ fontFamily: 'var(--font-mali)' }}
            >
              Delete Save?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
              This will permanently delete all progress, coins, and streaks for{' '}
              <strong>{save.name}</strong>.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 font-bold text-xs tracking-wider uppercase hover:bg-white/90 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-3 rounded-2xl bg-rose-500 text-white font-bold text-xs tracking-wider uppercase hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
                onClick={() => {
                  deleteSaveSlot();
                  setConfirmDelete(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Level Modal */}
      {isChangingLevel && save && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setIsChangingLevel(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-80 shadow-2xl border border-white/20 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <i className="fi fi-sr-graduation-cap text-3xl text-[#C8A44E] mb-2 block" />
              <h3
                className="text-lg font-bold text-slate-800 dark:text-white"
                style={{ fontFamily: 'var(--font-mali)' }}
              >
                Select English Level
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This will adapt vocabulary focus and questions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {CEFR_LEVEL_ORDER.map((lvl) => (
                <button
                  key={lvl}
                  className={`py-2 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                    save.cefrLevel === lvl
                      ? 'bg-[#C8A44E] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-200/50 dark:hover:bg-slate-700'
                  }`}
                  onClick={() => {
                    persistSave({
                      ...save,
                      cefrLevel: lvl,
                      cefrUpgradeStreak: 0,
                    });
                    playSound('correct');
                    setIsChangingLevel(false);
                  }}
                >
                  {CEFR_LEVEL_LABELS[lvl].split(' ')[0]}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <button
                className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer text-center bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50"
                onClick={() => setIsChangingLevel(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
