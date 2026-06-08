'use client';

import { useEffect, useRef } from 'react';

interface Props {
  level: number;
  onDismiss: () => void;
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'Thai Match',
  2: 'Phonics Match',
  3: 'Letter Match',
  4: 'Missing Capitals',
  5: 'Missing Lowercase',
  6: 'Typing Challenge',
};

const INSTRUCTIONS: Record<number, { en: string; th: string }> = {
  1: {
    en: 'Listen to the Thai name, then tap the matching English letter!',
    th: 'ฟังชื่อภาษาไทย แล้วเลือกตัวอักษรภาษาอังกฤษที่ตรงกัน!',
  },
  2: {
    en: 'Listen to the phonics sound, then tap the matching English letter!',
    th: 'ฟังเสียงอ่าน แล้วเลือกตัวอักษรภาษาอังกฤษที่ตรงกัน!',
  },
  3: {
    en: 'Tap the matching lowercase letter!',
    th: 'เลือกตัวพิมพ์เล็กที่ตรงกัน!',
  },
  4: {
    en: 'Tap the missing capital letter!',
    th: 'เลือกตัวพิมพ์ใหญ่ที่หายไป!',
  },
  5: {
    en: 'Tap the missing lowercase letter!',
    th: 'เลือกตัวพิมพ์เล็กที่หายไป!',
  },
  6: {
    en: 'Type the missing letters, then tap Check Answers!',
    th: 'พิมพ์ตัวอักษรที่หายไป แล้วกดตรวจสอบ!',
  },
};

export default function OnboardingOverlay({ level, onDismiss }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  const label = LEVEL_LABELS[level] || `Level ${level}`;
  const instructions = INSTRUCTIONS[level] || { en: 'Good luck!', th: 'ขอให้โชคดี!' };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-[2rem] p-8 md:p-10 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-3xl font-black mx-auto">
          {level}
        </div>
        <h2 className="text-2xl font-black text-violet-600 dark:text-violet-400">{label}</h2>
        <p className="text-lg font-bold text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {instructions.en}
        </p>
        <p className="text-base font-bold text-zinc-500 dark:text-zinc-400">{instructions.th}</p>
        <button
          onClick={onDismiss}
          className="px-8 py-3 bg-violet-600 text-white text-lg font-black rounded-2xl shadow-[0_6px_0_0_#5b21b6] active:shadow-none active:translate-y-1.5 transition-all hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-white"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
