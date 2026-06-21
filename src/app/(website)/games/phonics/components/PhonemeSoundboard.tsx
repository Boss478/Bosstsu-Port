"use client";

import { PHONEMES } from "../constants";
import type { PhonemeData } from "../types";

interface PhonemeGroup {
  id: string;
  label: string;
  phonemes: PhonemeData[];
}

const PHONEME_GROUPS: PhonemeGroup[] = [
  {
    id: "consonants",
    label: "Consonants",
    phonemes: PHONEMES.filter((p) => p.tier === "basic" || p.tier === "consonants"),
  },
  {
    id: "vowels",
    label: "Vowels",
    phonemes: PHONEMES.filter((p) => p.tier === "vowels"),
  },
  {
    id: "blends",
    label: "Blends",
    phonemes: PHONEMES.filter((p) => p.tier === "blends"),
  },
];

function getPhonemeHighlight(p: PhonemeData): { start: number; end: number } | null {
  const ex = p.example.toLowerCase();
  const id = p.id;

  const idIdx = ex.indexOf(id);
  if (idIdx !== -1) return { start: idIdx, end: idIdx + id.length };

  if (p.tier === "vowels" && id.length >= 2) {
    const first = id[0];
    const fi = ex.indexOf(first);
    if (fi !== -1) return { start: fi, end: fi + 1 };
  }

  const edge: Record<string, string> = {
    k: "c", j: "y", zh: "s", uh: "a", uh2: "oo",
    dz: "j", g: "g", ie: "y", eer: "ear",
  };
  const needle = edge[id];

  if (needle) {
    const ni = ex.indexOf(needle);
    if (ni !== -1) return { start: ni, end: ni + needle.length };
  }

  const fallback = ex.indexOf(ex[0]);
  if (fallback !== -1) return { start: fallback, end: fallback + 1 };
  return null;
}

interface PhonemeSoundboardProps {
  layoutMode: "vertical" | "horizontal";
  phonemeLabelMode: "both" | "ipa" | "example";
  selectedPhonemeIds: string[];
  onPhonemeClick: (p: PhonemeData) => void;
  correctPhonemeIds?: string[];
  disabled?: boolean;
  sortMode?: "grouped" | "flat";
  sortOrder?: "default" | "asc" | "desc";
}

export function sortPhonemes(phonemes: PhonemeData[], order: "default" | "asc" | "desc"): PhonemeData[] {
  if (order === "default") return phonemes;
  const sorted = [...phonemes].sort((a, b) => a.id.localeCompare(b.id));
  return order === "desc" ? sorted.reverse() : sorted;
}

export function PhonemeSoundboard({
  layoutMode,
  phonemeLabelMode,
  selectedPhonemeIds,
  onPhonemeClick,
  correctPhonemeIds,
  disabled = false,
  sortMode = "grouped",
  sortOrder = "default",
}: PhonemeSoundboardProps) {
  const gridClass = layoutMode === "vertical" ? "grid grid-cols-5 gap-1.5" : "grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-6 gap-1.5";

  function renderPhonemeButton(p: PhonemeData) {
    const isCorrect = correctPhonemeIds?.includes(p.id) ?? false;
    const isSelected = selectedPhonemeIds.includes(p.id) && !isCorrect;
    const hl = getPhonemeHighlight(p);
    return (
      <div key={p.id} className="group relative">
        <button
          onClick={() => onPhonemeClick(p)}
          disabled={disabled}
          className={`w-full rounded-xl border text-center transition-all ${
            phonemeLabelMode === "both" ? "py-3 px-1.5" : "py-4 px-1.5 flex items-center justify-center min-h-[52px]"
          } ${
            disabled
              ? "cursor-default"
              : "cursor-pointer"
          } ${
             isCorrect
              ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600"
              : isSelected
                ? "bg-[#C8A44E]/20 dark:bg-[#C8A44E]/30 border-[#C8A44E] shadow-xs"
                : "bg-white/50 dark:bg-slate-800/50 border-white/50 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600"
          } disabled:opacity-100`}
        >
          {phonemeLabelMode === "both" && (
            <>
              <span
                className={`text-xs sm:text-sm font-black block leading-none whitespace-nowrap ${isCorrect ? "text-emerald-700 dark:text-emerald-300" : isSelected ? "text-[#C8A44E]" : "text-slate-700 dark:text-[#F7E1A0]"}`}
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {p.ipa}
              </span>
              <span className={`text-[7px] font-bold uppercase mt-0.5 block truncate ${isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                {hl ? (
                  <>
                    {p.example.slice(0, hl.start)}
                    <u className={`decoration-dotted underline-offset-2 ${isCorrect ? "decoration-emerald-500" : "decoration-[#C8A44E]"}`}>
                      {p.example.slice(hl.start, hl.end)}
                    </u>
                    {p.example.slice(hl.end)}
                  </>
                ) : (
                  p.example
                )}
              </span>
            </>
          )}
          {phonemeLabelMode === "ipa" && (
            <span
              className={`text-sm sm:text-base font-black block leading-none whitespace-nowrap ${isCorrect ? "text-emerald-700 dark:text-emerald-300" : isSelected ? "text-[#C8A44E]" : "text-slate-700 dark:text-[#F7E1A0]"}`}
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {p.ipa}
            </span>
          )}
          {phonemeLabelMode === "example" && (
            <span
              className={`text-xs sm:text-sm font-extrabold block leading-none truncate ${isCorrect ? "text-emerald-700 dark:text-emerald-300" : isSelected ? "text-[#C8A44E]" : "text-slate-700 dark:text-[#F7E1A0]"}`}
            >
              {hl ? (
                <>
                  {p.example.slice(0, hl.start)}
                  <u className={`decoration-dotted underline-offset-2 ${isCorrect ? "decoration-emerald-500" : "decoration-[#C8A44E]"}`}>
                    {p.example.slice(hl.start, hl.end)}
                  </u>
                  {p.example.slice(hl.end)}
                </>
              ) : (
                p.example
              )}
            </span>
          )}
        </button>
        <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap rounded-lg bg-slate-800/95 dark:bg-slate-700/95 px-2.5 py-1 text-[9px] font-bold text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50">
          {p.name}
        </span>
      </div>
    );
  }

  if (sortMode === "flat") {
    const allPhonemes = sortPhonemes(PHONEMES, sortOrder);
    return (
      <div className="space-y-1.5">
        <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
          All Phonemes
        </p>
        <div className={gridClass}>
          {allPhonemes.map(renderPhonemeButton)}
        </div>
      </div>
    );
  }

  return (
    <div className={layoutMode === "vertical" ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "flex flex-col gap-5"}>
      {PHONEME_GROUPS.map((group) => (
        <div key={group.id} className="space-y-1.5">
          <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
            {group.label}
          </p>
          <div className={gridClass}>
            {sortPhonemes(group.phonemes, sortOrder).map(renderPhonemeButton)}
          </div>
        </div>
      ))}
    </div>
  );
}
