'use client';

import { useEffect, useRef } from 'react';
import type { LevelType } from '../types';

interface Props {
  name: string;
  type: LevelType;
  onDismiss: () => void;
}

const INSTRUCTIONS: Record<LevelType, { en: string; th: string }> = {
  match: {
    en: 'Tap the correct letter that matches!',
    th: 'เลือกตัวอักษรที่ตรงกัน!',
  },
  'fill-upper': {
    en: 'Tap the missing capital letter!',
    th: 'เลือกตัวพิมพ์ใหญ่ที่หายไป!',
  },
  'fill-lower': {
    en: 'Tap the missing lowercase letter!',
    th: 'เลือกตัวพิมพ์เล็กที่หายไป!',
  },
  typing: {
    en: 'Type the missing letters, then tap Check Answers!',
    th: 'พิมพ์ตัวอักษรที่หายไป แล้วกดตรวจสอบ!',
  },
};

function MatchIllustration() {
  return (
    <svg viewBox="0 0 200 100" className="w-full max-w-[200px] mx-auto">
      <rect x="10" y="5" width="60" height="60" rx="12" fill="#8b5cf6" />
      <text x="40" y="47" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">
        A
      </text>
      <circle cx="140" cy="20" r="16" fill="#e4e4e7" />
      <text x="140" y="25" textAnchor="middle" fill="#71717a" fontSize="16" fontWeight="bold">
        a
      </text>
      <circle cx="170" cy="20" r="16" fill="#e4e4e7" />
      <text x="170" y="25" textAnchor="middle" fill="#71717a" fontSize="16" fontWeight="bold">
        b
      </text>
      <circle cx="155" cy="60" r="16" fill="#8b5cf6" />
      <text x="155" y="65" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
        c
      </text>
      <line x1="70" y1="35" x2="118" y2="25" stroke="#c084fc" strokeWidth="2" strokeDasharray="4" />
    </svg>
  );
}

function FillIllustration() {
  return (
    <svg viewBox="0 0 200 60" className="w-full max-w-[200px] mx-auto">
      {'ABCDEFG'.split('').map((c, i) => (
        <g key={i}>
          <rect
            x={i * 27 + 5}
            y="10"
            width="22"
            height="40"
            rx="6"
            fill={c === 'D' ? '#fef08a' : '#e4e4e7'}
            stroke={c === 'D' ? '#eab308' : '#d4d4d8'}
            strokeWidth="2"
          />
          <text
            x={i * 27 + 16}
            y="36"
            textAnchor="middle"
            fill={c === 'D' ? '#a16207' : '#71717a'}
            fontSize="18"
            fontWeight="bold"
          >
            {c}
          </text>
          {c === 'D' && (
            <text
              x={i * 27 + 16}
              y="60"
              textAnchor="middle"
              fill="#eab308"
              fontSize="10"
              fontWeight="bold"
            >
              ?
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function KeyboardIllustration() {
  return (
    <svg viewBox="0 0 200 70" className="w-full max-w-[200px] mx-auto">
      {[
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
      ].map((row, r) =>
        row.map((c, i) => (
          <rect
            key={`${r}-${i}`}
            x={i * 16 + 5 + (r === 1 ? 8 : r === 2 ? 16 : 0)}
            y={r * 20 + 5}
            width="14"
            height="16"
            rx="3"
            fill={c === 'A' ? '#c084fc' : '#e4e4e7'}
          />
        )),
      )}
    </svg>
  );
}

const ILLUSTRATIONS = {
  match: MatchIllustration,
  'fill-upper': FillIllustration,
  'fill-lower': FillIllustration,
  typing: KeyboardIllustration,
};

export default function OnboardingOverlay({ name, type, onDismiss }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  const { en, th } = INSTRUCTIONS[type] || { en: 'Good luck!', th: 'ขอให้โชคดี!' };
  const Illustration = ILLUSTRATIONS[type] || MatchIllustration;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-[2rem] p-8 md:p-10 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-3xl font-black mx-auto">
          <i className="fi fi-sr-bulb text-2xl" />
        </div>
        <h2 className="text-2xl font-black text-violet-600 dark:text-violet-400">{name}</h2>
        <Illustration />
        <p className="text-lg font-bold text-zinc-600 dark:text-zinc-300 leading-relaxed">{en}</p>
        <p className="text-base font-bold text-zinc-500 dark:text-zinc-400">{th}</p>
        <button
          onClick={onDismiss}
          className="px-8 py-3 bg-violet-600 text-white text-lg font-black rounded-2xl shadow-[0_6px_0_0_#5b21b6] active:shadow-none active:translate-y-1.5 transition-all hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-white"
        >
          Let&apos;s go!
        </button>
      </div>
    </div>
  );
}
