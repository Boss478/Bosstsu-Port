'use client';

import { useRef, useState } from 'react';
import { getBaseWord } from '../cards/cards';
import { CardIllustration } from '../cards/CardIllustrations';
import { CardWordIllustration } from '../cards/CardWordArt';
import { ALPHABET_UPPER } from '../constants';
import { useScrollHint } from '../hooks/useScrollHint';
import ScrollHint from './ScrollHint';
import BackButton from './BackButton';

interface Props {
  onBack: () => void;
  onSpeak: (text: string, lang?: string) => void;
  voiceURI?: string;
}

export default function LetterExplorerScreen({ onBack, onSpeak, voiceURI }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { hasMore, atBottom, scrollDown } = useScrollHint(scrollRef, selected);

  const handleTap = (letter: string) => {
    setSelected(letter);
    const word = getBaseWord(letter) || letter;
    const lang = voiceURI?.includes('th') ? 'th-TH' : 'en-US';
    onSpeak(`${letter}. ${letter} is for ${word}`, lang);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[2.5rem] p-4 sm:p-6 shadow-2xl text-center space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 max-h-[calc(100dvh-2rem)] flex flex-col">
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} title="Back to Menu" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-violet-600 dark:text-violet-400">
              🔤 Letter Sounds
            </h1>
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
              Tap a letter to hear it
            </p>
          </div>
          <div className="w-12" />
        </div>

        {selected && (
          <div className="bg-violet-50 dark:bg-violet-900/10 rounded-3xl p-4 border-2 border-violet-100 dark:border-violet-900/30 animate-in zoom-in duration-300">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-md border-2 border-violet-100 dark:border-violet-700">
                <span className="text-3xl sm:text-4xl font-black text-violet-600 dark:text-violet-400">
                  {selected}
                </span>
              </div>
              <CardWordIllustration word={getBaseWord(selected)} letter={selected} size={64} />
              <div className="text-left">
                <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                  {selected} is for
                </p>
                <p className="text-xl sm:text-2xl font-black text-violet-700 dark:text-violet-300">
                  {getBaseWord(selected)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const word = getBaseWord(selected) || selected;
                const lang = voiceURI?.includes('th') ? 'th-TH' : 'en-US';
                onSpeak(`${selected}. ${selected} is for ${word}`, lang);
              }}
              className="mt-3 px-4 py-2 rounded-full bg-violet-200 dark:bg-violet-800 hover:bg-violet-300 dark:hover:bg-violet-700 text-violet-700 dark:text-violet-300 text-xs font-black transition-colors"
            >
              🔊 Listen Again
            </button>
          </div>
        )}

        {!selected && (
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
            👆 Tap any letter below to hear its sound
          </p>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2 sm:gap-3">
            {ALPHABET_UPPER.map((letter) => (
              <button
                key={letter}
                onClick={() => handleTap(letter)}
                className={`group relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 border-2 hover:scale-105 active:scale-95 ${
                  selected === letter
                    ? 'bg-violet-100 dark:bg-violet-900/40 border-violet-400 dark:border-violet-500 ring-2 ring-violet-300 dark:ring-violet-600'
                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                }`}
              >
                <CardIllustration letter={letter} size={28} />
                <span
                  className={`text-sm sm:text-base font-black ${
                    selected === letter
                      ? 'text-violet-700 dark:text-violet-300'
                      : 'text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {letter}
                </span>
              </button>
            ))}
          </div>
        </div>

        {hasMore && !atBottom && <ScrollHint onScrollDown={scrollDown} roundedBottom />}
      </div>
    </div>
  );
}
