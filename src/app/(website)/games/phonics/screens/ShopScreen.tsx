"use client";

import { useGame } from "../context";
import { useMemo, useCallback, useState } from "react";
import { useAudio } from "@/hooks/useAudio";
import { COMPANIONS } from "../constants";
import type { CompanionId, SaveData } from "../types";
import MascotCanvas from "../components/MascotCanvas";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  iconClass: string;
}

export default function ShopScreen() {
  const { save, persistSave } = useGame();
  const { playSound } = useAudio();

  const [shopTab, setShopTab] = useState<"mascots" | "powerups">("mascots");

  const userCoins = save?.phonemeCoins ?? 0;
  const unlockedItems = useMemo(() => save?.unlockedItems ?? [], [save?.unlockedItems]);
  const unlockedCompanions = useMemo(() => save?.unlockedCompanions ?? ['nox', 'mira', 'chip'], [save?.unlockedCompanions]);

  const premiumCompanions = useMemo(
    () => Object.values(COMPANIONS).filter(c => c.cost > 0).sort((a, b) => a.cost - b.cost),
    [],
  );

  const shopItems: ShopItem[] = useMemo(() => [
    {
      id: "streak_freeze",
      name: "Streak Freeze",
      description: "Protects your streak when you miss a day.",
      cost: 10,
      iconClass: "fi fi-sr-brightness text-cyan-500",
    },
    {
      id: "double_coins",
      name: "Double Coins Boost",
      description: "Earn 2x coins on your next lesson round.",
      cost: 20,
      iconClass: "fi fi-sr-bolt text-yellow-500",
    },
    {
      id: "golden_crown",
      name: "Golden Crown skin",
      description: "Adorns your Owl companion with a beautiful golden crown.",
      cost: 50,
      iconClass: "fi fi-sr-trophy text-amber-500",
    },
    {
      id: "witch_hat",
      name: "Witch Hat skin",
      description: "Gives your Witch companion a glowing neon purple hat.",
      cost: 40,
      iconClass: "fi fi-sr-palette text-purple-500",
    },
    {
      id: "cyber_neon",
      name: "Cyber Neon chassis",
      description: "Recolors your Robot companion body with glowing neon cyber paint.",
      cost: 30,
      iconClass: "fi fi-sr-settings text-blue-500",
    },
  ], []);

  const handleBuyItem = useCallback((item: ShopItem) => {
    if (!save || userCoins < item.cost) return;

    const isUnlocked = unlockedItems.includes(item.id);
    if (isUnlocked) return;

    const updated = {
      ...save,
      phonemeCoins: save.phonemeCoins - item.cost,
      unlockedItems: [...unlockedItems, item.id],
    };

    persistSave(updated);
    playSound("correct");
  }, [save, userCoins, unlockedItems, persistSave, playSound]);

  const handleBuyCompanion = useCallback((id: CompanionId, cost: number) => {
    if (!save || userCoins < cost) return;

    const isUnlocked = unlockedCompanions.includes(id);
    if (isUnlocked) return;

    const updated = {
      ...save,
      phonemeCoins: save.phonemeCoins - cost,
      unlockedCompanions: [...unlockedCompanions, id as CompanionId],
    };

    persistSave(updated as SaveData);
    playSound("tada");
  }, [save, userCoins, unlockedCompanions, persistSave, playSound]);

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain bg-transparent min-h-full">
      <div className="max-w-2xl mx-auto px-6 py-8 pb-36">
        
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-xs mb-3 animate-breathe">
            <i className="fi fi-sr-shopping-cart text-[#C8A44E] text-2xl" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-[#F7E1A0] tracking-wide" style={{ fontFamily: "var(--font-mali)" }}>
            Island Bazaar
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-widest">Spend your coins on rewards</p>
        </div>

        {/* Coins Balance Box */}
        <div className="relative overflow-hidden p-5 rounded-3xl border border-amber-500/20 dark:border-amber-500/10 shadow-lg flex items-center justify-between mb-8 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent backdrop-blur-md">
          {/* Gold glowing effect inside */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />
          <div className="text-left">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Available Balance</span>
            <span className="text-2xl font-black text-[#C8A44E] drop-shadow-xs mt-1 inline-flex items-center gap-2" style={{ fontFamily: "var(--font-mali)" }}>
              <i className="fi fi-sr-wallet text-amber-500 text-xl" /> {userCoins} <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Coins</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-xl shadow-inner">
            <i className="fi fi-sr-wallet" />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 justify-center mb-8">
          <button
            onClick={() => setShopTab("mascots")}
            className={`px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
              shopTab === "mascots"
                ? "bg-[#C8A44E] text-white shadow-sm"
                : "bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80"
            }`}
          >
            <i className="fi fi-sr-users mr-1.5" /> Mascots
          </button>
          <button
            onClick={() => setShopTab("powerups")}
            className={`px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
              shopTab === "powerups"
                ? "bg-[#C8A44E] text-white shadow-sm"
                : "bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80"
            }`}
          >
            <i className="fi fi-sr-gem mr-1.5" /> Power-ups
          </button>
        </div>

        {/* Companions Section */}
        {shopTab === "mascots" && (
        <div className="mb-10">
          <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <i className="fi fi-sr-users text-sm" /> Unlockable Companions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {premiumCompanions.map((comp) => {
              const isUnlocked = unlockedCompanions.includes(comp.id as CompanionId);
              const canAfford = userCoins >= comp.cost;
              const cardBg = `${comp.color}0a`; // 4% opacity
              const cardBorder = `${comp.color}25`; // 15% opacity
              const tagBg = `${comp.color}15`; // 8% opacity

              return (
                <div
                  key={comp.id}
                  style={{ 
                    backgroundColor: cardBg, 
                    borderColor: cardBorder,
                    '--comp-color-glow': `${comp.color}18`
                  } as React.CSSProperties}
                  className="glass-panel p-5 rounded-3xl border shadow-xs flex flex-col justify-between gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--comp-color-glow)] relative overflow-hidden group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/50 dark:border-slate-800/80 shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative">
                      <MascotCanvas
                        companionId={comp.id as CompanionId}
                        size={56}
                        className="scale-105"
                      />
                    </div>
                    <div className="text-left flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-base text-slate-800 dark:text-slate-100 truncate">{comp.name}</span>
                        <span 
                          style={{ backgroundColor: tagBg, color: comp.color }}
                          className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide select-none"
                        >
                          {comp.type}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 italic leading-snug">
                        &ldquo;{comp.personality}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/10 dark:border-slate-800/40 pt-3 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Companion Access</span>
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        ✓ Unlocked
                      </span>
                    ) : (
                      <button
                        className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase btn-3d shadow-xs cursor-pointer flex items-center gap-1.5 transition-all ${
                          canAfford
                            ? "bg-[#C8A44E] text-white hover:brightness-105"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400 border-b-0 cursor-not-allowed"
                        }`}
                        disabled={!canAfford}
                        onClick={() => handleBuyCompanion(comp.id as CompanionId, comp.cost)}
                        style={canAfford ? { "--border-color": "#91722e" } as React.CSSProperties : undefined}
                      >
                        <i className="fi fi-sr-wallet text-xs" /> {comp.cost} Coins
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Shop Items Section */}
        {shopTab === "powerups" && (
        <div>
          <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <i className="fi fi-sr-gem text-sm" /> Power-ups & Cosmetics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shopItems.map((item) => {
              const isUnlocked = unlockedItems.includes(item.id);
              const canAfford = userCoins >= item.cost;

              // Extract item color themes based on name
              let itemColor = "#C8A44E";
              if (item.id.includes("streak")) itemColor = "#2EC4B6";
              else if (item.id.includes("double")) itemColor = "#E2B237";
              else if (item.id.includes("crown")) itemColor = "#D4AF37";
              else if (item.id.includes("witch")) itemColor = "#9B59B6";
              else if (item.id.includes("cyber")) itemColor = "#3498DB";

              const cardBg = `${itemColor}08`; 
              const cardBorder = `${itemColor}20`; 
              const iconBg = `${itemColor}15`;

              return (
                <div
                  key={item.id}
                  style={{ 
                    backgroundColor: cardBg, 
                    borderColor: cardBorder,
                    '--item-color-glow': `${itemColor}15`
                  } as React.CSSProperties}
                  className="glass-panel p-5 rounded-3xl border shadow-xs flex flex-col justify-between gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--item-color-glow)] relative overflow-hidden"
                >
                  {/* Left detail */}
                  <div className="flex items-start gap-4">
                    <div 
                      style={{ backgroundColor: iconBg }}
                      className="w-14 h-14 rounded-2xl border border-white/30 dark:border-slate-800 shadow-xs flex items-center justify-center text-xl shrink-0"
                    >
                      <i className={item.iconClass} />
                    </div>
                    <div className="text-left flex-1 min-w-0 space-y-1">
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate block">{item.name}</span>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-normal">{item.description}</p>
                    </div>
                  </div>

                  {/* Buy Button */}
                  <div className="border-t border-white/10 dark:border-slate-800/40 pt-3 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Item Availability</span>
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        ✓ Unlocked
                      </span>
                    ) : (
                      <button
                        className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase btn-3d shadow-xs cursor-pointer flex items-center gap-1.5 transition-all ${
                          canAfford
                            ? "bg-[#C8A44E] text-white hover:brightness-105"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400 border-b-0 cursor-not-allowed"
                        }`}
                        disabled={!canAfford}
                        onClick={() => handleBuyItem(item)}
                        style={canAfford ? { "--border-color": "#91722e" } as React.CSSProperties : undefined}
                      >
                        <i className="fi fi-sr-wallet text-xs" /> {item.cost} Coins
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
