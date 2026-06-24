'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { useGame } from '../context';
import type { GameRound, CefrLevel, WordData, Question } from '../types';
import { CEFR_LEVEL_LABELS, CEFR_LEVEL_ORDER } from '../constants';
import { useAudio } from '@/hooks/useAudio';

function getQuestionWord(q: Question): WordData | undefined {
  if (q.category === 'exercise') {
    const ex = q as { data: { word?: WordData } };
    return ex.data?.word;
  }
  if ('word' in q) return (q as { word: WordData }).word;
  return undefined;
}

function getQuestionCorrectAnswer(q: Question): string {
  if (q.category === 'exercise') {
    const ex = q as { data: { correctAnswer: string } };
    return ex.data?.correctAnswer ?? '';
  }
  if (q.category === 'spelling') {
    const sp = q as { inputMode: string; word: { phonemes: string[]; word: string } };
    return sp.inputMode === 'tiles' ? sp.word.phonemes.join(' ') : sp.word.word;
  }
  if ('correctAnswer' in q) return (q as { correctAnswer: string }).correctAnswer;
  return '';
}

function getQuestionPhonemeIpa(q: Question): string | undefined {
  if (q.category === 'exercise') {
    const ex = q as { data: { phoneme?: { ipa: string } } };
    return ex.data?.phoneme?.ipa;
  }
  if ('phoneme' in q) return (q as { phoneme: { ipa: string } }).phoneme.ipa;
  return undefined;
}

interface VictoryScreenProps {
  round: GameRound;
  onPlayAgain: () => void;
  onRetryIncorrect?: () => void;
  onBackToPath: () => void;
}

function StarRating({ corrects, total }: { corrects: number; total: number }) {
  const pct = total > 0 ? corrects / total : 0;
  const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;

  return (
    <div className="flex gap-4 justify-center py-4" aria-label={`${stars} out of 3 stars`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`text-5xl md:text-6xl filter drop-shadow-sm select-none ${
            n <= stars ? 'animate-star-pop' : 'opacity-20'
          }`}
          style={{
            animationDelay: `${(n - 1) * 0.2}s`,
            color: n <= stars ? '#FFBA08' : '#888888',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center border border-white/20 shadow-xs hover:-translate-y-1 transition-transform duration-300">
      <span
        className="text-xl mb-1 filter drop-shadow-2xs select-none flex items-center justify-center"
        style={{ color }}
      >
        {icon}
      </span>
      <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
      </span>
      <span className="text-lg font-extrabold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export default function VictoryScreen({
  round,
  onPlayAgain,
  onRetryIncorrect,
  onBackToPath,
}: VictoryScreenProps) {
  const { save } = useGame();
  const { playWordAudio } = useAudio();
  const [selectedReviewWord, setSelectedReviewWord] = useState<WordData | null>(null);
  const announced = useRef(false);

  const accuracy = useMemo(() => {
    return round.results.length > 0 ? Math.round((round.corrects / round.results.length) * 100) : 0;
  }, [round.corrects, round.results.length]);

  const levelChange = useMemo(() => {
    if (!save || round.config.isPlacement || round.config.category !== 'definitions') return null;
    const prevIdx = (CEFR_LEVEL_ORDER as readonly CefrLevel[]).indexOf(round.config.level);
    const nextIdx = (CEFR_LEVEL_ORDER as readonly CefrLevel[]).indexOf(save.cefrLevel);
    if (prevIdx === -1 || nextIdx === -1 || prevIdx === nextIdx) return null;
    return nextIdx > prevIdx ? 'upgrade' : 'downgrade';
  }, [save, round.config.level, round.config.category, round.config.isPlacement]);

  useEffect(() => {
    if (!announced.current) {
      announced.current = true;
    }
  }, []);

  const announceText = `Round complete! You scored ${round.score} with ${accuracy} percent accuracy. ${round.corrects} out of ${round.results.length} correct.`;

  const [confettiItems] = useState(() => {
    const colors = ['#2EC4B6', '#FF70A6', '#C8A44E', '#FFBA08', '#9B59B6'];
    return Array.from({ length: 15 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2.5 + Math.random() * 2,
      size: 6 + Math.random() * 8,
      bg: colors[Math.floor(Math.random() * colors.length)],
    }));
  });

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain bg-transparent relative">
      {/* Confetti container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {confettiItems.map((item, i) => (
          <div
            key={i}
            className="absolute -top-10 rounded-xs pointer-events-none opacity-85"
            style={{
              left: `${item.left}%`,
              width: item.size,
              height: item.size,
              backgroundColor: item.bg,
              animationName: 'confetti-fall',
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'linear',
            }}
          />
        ))}

        {/* Style block for confetti fallback animations */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes confetti-fall {
            0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
          }
        `,
          }}
        />
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-10 pb-28 max-w-md mx-auto w-full relative z-10">
        <div className="sr-only" aria-live="assertive" aria-atomic="true">
          {announceText}
        </div>

        {/* Title Badge & Star Rating / Placement Card */}
        {round.config.isPlacement ? (
          <div className="w-full text-center space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-[#2EC4B6]/10 border border-[#2EC4B6]/30 text-xs font-bold text-[#2EC4B6] dark:text-[#2EC4B6] mb-2 uppercase tracking-widest animate-pulse flex items-center gap-1.5 justify-center">
              <i className="fi fi-sr-graduation-cap text-sm" /> Assessment Complete
            </div>
            <h1
              className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-[#F7E1A0] tracking-wider uppercase drop-shadow-sm"
              style={{ fontFamily: 'var(--font-mali)' }}
            >
              YOUR PLACEMENT
            </h1>

            {/* Display Placed Level */}
            <div className="glass-panel p-6 rounded-3xl border-2 border-[#C8A44E]/40 shadow-xl max-w-sm mx-auto bg-gradient-to-br from-white/80 to-[#FAE8FF]/30 dark:from-slate-900/80 dark:to-[#2A1242]/30 relative overflow-hidden flex flex-col items-center">
              <span className="text-5xl md:text-6xl filter drop-shadow-sm select-none mb-3">
                🎓
              </span>
              <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Target Proficiency Level
              </p>
              <h2
                className="text-2xl md:text-3xl font-black text-[#C8A44E] mt-1"
                style={{ fontFamily: 'var(--font-mali)' }}
              >
                {CEFR_LEVEL_LABELS[save?.cefrLevel ?? 'a1']}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-350 mt-4 font-medium leading-relaxed px-4">
                {save?.cefrLevel === 'a1' &&
                  'Placed at Beginner Level. We will start with basic short vowel sounds and high-frequency phonemes.'}
                {save?.cefrLevel === 'a2' &&
                  'Placed at Elementary Level. We will practice short vowel combinations and initial blends.'}
                {save?.cefrLevel === 'b1' &&
                  'Placed at Intermediate Level. Focus is on long vowels, diphthongs, and common consonant digraphs.'}
                {save?.cefrLevel === 'b2' &&
                  'Placed at Upper-Intermediate Level. We will cover advanced diphthongs, R-controlled vowels, and complex syllable structures.'}
                {save?.cefrLevel === 'c1' &&
                  'Placed at Advanced Level. Focus is on rare phoneme segments and complex words.'}
                {save?.cefrLevel === 'c2' &&
                  'Placed at Mastery Level. Challenging vocabulary and rapid speed rounds.'}
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
              Assessment accuracy: {accuracy}% ({round.corrects} / {round.results.length} correct)
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-1">
              * This is an approximate calculation. Contact the instructor for a formal evaluation.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-4 uppercase tracking-widest animate-pulse flex items-center gap-1.5 justify-center">
                <i className="fi fi-sr-star text-sm" /> Round Complete
              </div>
              <h1
                className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-[#F7E1A0] tracking-wider uppercase drop-shadow-sm"
                style={{ fontFamily: 'var(--font-mali)' }}
              >
                WELL DONE!
              </h1>
            </div>

            <StarRating corrects={round.corrects} total={round.results.length} />

            <div className="grid grid-cols-2 gap-3.5 w-full mt-6">
              <StatTile
                label="Score"
                value={`${round.score}`}
                icon={<i className="fi fi-sr-star" />}
                color="#C8A44E"
              />
              <StatTile
                label="Accuracy"
                value={`${accuracy}%`}
                icon={<i className="fi fi-sr-medal" />}
                color="#2EC4B6"
              />
              <StatTile
                label="Best Streak"
                value={`${round.maxStreak}`}
                icon={<i className="fi fi-sr-flame" />}
                color="#FFBA08"
              />
              <StatTile
                label="Coins"
                value={`+${round.coinsEarned}`}
                icon={<i className="fi fi-sr-wallet" />}
                color="#C8A44E"
              />
            </div>

            {save && (
              <div className="w-full text-center mt-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-center">
                Total Inventory:{' '}
                <span className="text-[#C8A44E] flex items-center gap-1">
                  <i className="fi fi-sr-wallet text-xs" /> {save.phonemeCoins}
                </span>
              </div>
            )}
          </>
        )}

        {/* Level Change Notification Banners */}
        {levelChange === 'upgrade' && (
          <div className="w-full max-w-sm p-4 mt-6 rounded-3xl border bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-400/40 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs tracking-wider uppercase animate-bounce flex items-center justify-center gap-2.5">
            <i className="fi fi-sr-trophy text-base text-yellow-500" />
            <span>LEVEL UP! You upgraded to {CEFR_LEVEL_LABELS[save?.cefrLevel ?? 'a1']}!</span>
          </div>
        )}
        {levelChange === 'downgrade' && (
          <div className="w-full max-w-sm p-4 mt-6 rounded-3xl border bg-amber-500/10 dark:bg-amber-950/20 border-amber-400/40 text-amber-600 dark:text-amber-400 font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2.5">
            <i className="fi fi-sr-info text-base text-amber-500 animate-pulse" />
            <span>
              Level Adjusted: set to {CEFR_LEVEL_LABELS[save?.cefrLevel ?? 'a1']} to match
              performance.
            </span>
          </div>
        )}

        {/* Question Review Accordion-Glass Box */}
        <div className="glass-panel rounded-3xl border border-white/20 shadow-sm w-full mt-6 overflow-hidden">
          <div className="p-4 border-b border-white/20 dark:border-slate-800 flex items-center justify-between bg-white/30 dark:bg-slate-900/20">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-widest uppercase">
              QUESTION REVIEW
            </p>
            <span className="text-[10px] bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold text-slate-500">
              {round.results.length} Answers
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-white/10 dark:divide-slate-800/50">
            {round.results.map((r, i) => {
              const wordData = getQuestionWord(r.question);
              const correctAns = getQuestionCorrectAnswer(r.question);
              const phonemeIpa = getQuestionPhonemeIpa(r.question);
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 ${
                    r.correct
                      ? 'bg-emerald-500/5 dark:bg-emerald-950/5'
                      : 'bg-rose-500/5 dark:bg-rose-950/5'
                  }`}
                  onClick={() => wordData && setSelectedReviewWord(wordData)}
                >
                  <span
                    className={`text-base font-bold ${r.correct ? 'text-emerald-500' : 'text-rose-500'}`}
                  >
                    {r.correct ? '✓' : '✗'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                      {r.question.category === 'phonics' &&
                      r.question.format !== 'card-flip' &&
                      phonemeIpa
                        ? `Target Sound: ${phonemeIpa} (${wordData?.word ?? ''})`
                        : r.question.category === 'spelling'
                          ? `Word: ${wordData?.word ?? ''}`
                          : `Vocab: ${wordData?.word ?? ''}`}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      Your Answer: <span className="font-bold">{r.playerAnswer}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!r.correct && (
                      <span className="text-[10px] font-extrabold bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full">
                        {correctAns}
                      </span>
                    )}
                    <button
                      className="p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-400 hover:text-[#C8A44E] transition-all"
                      aria-label={`Pronunciation and details for ${wordData?.word ?? ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (wordData) setSelectedReviewWord(wordData);
                      }}
                    >
                      <i className="fi fi-sr-info text-xs" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedReviewWord && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
            onClick={() => setSelectedReviewWord(null)}
          >
            <div
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-scale-up text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3
                    className="text-2xl font-black text-slate-800 dark:text-white tracking-wide leading-tight"
                    style={{ fontFamily: 'var(--font-mali)' }}
                  >
                    {selectedReviewWord.word}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-[#C8A44E] font-mono">
                      {selectedReviewWord.ipa}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                      {selectedReviewWord.wordClass}
                    </span>
                    <span className="text-[10px] uppercase font-black text-emerald-500 px-1.5 py-0.5 bg-emerald-500/10 rounded">
                      {selectedReviewWord.level.toUpperCase()}
                    </span>
                  </div>
                </div>

                <button
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-450 hover:text-slate-700 transition-all cursor-pointer font-bold"
                  onClick={() => setSelectedReviewWord(null)}
                  aria-label="Close details"
                >
                  ✕
                </button>
              </div>

              {/* Pronounce Row */}
              <div className="flex items-center gap-3 bg-[#C8A44E]/10 border border-[#C8A44E]/20 rounded-2xl p-3">
                <button
                  className="w-10 h-10 rounded-xl bg-[#C8A44E] hover:brightness-105 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer btn-3d shadow-md"
                  onClick={() => playWordAudio(selectedReviewWord.word)}
                  style={{ '--border-color': '#91722e' } as React.CSSProperties}
                  aria-label={`Pronounce ${selectedReviewWord.word}`}
                >
                  <i className="fi fi-sr-volume text-sm" />
                </button>
                <div>
                  <p className="text-xs font-extrabold text-[#C8A44E] tracking-widest uppercase">
                    Listen
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Tap to hear correct pronunciation & stress
                  </p>
                </div>
              </div>

              {/* Meaning & Example */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Definition
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                    {selectedReviewWord.definition || 'No definition available.'}
                  </p>
                </div>

                {selectedReviewWord.example && (
                  <div className="space-y-1 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                    <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Example
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                      &ldquo;{selectedReviewWord.example}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Syllables list */}
              {selectedReviewWord.syllables && selectedReviewWord.syllables.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    Syllables
                  </p>
                  <div className="flex gap-1">
                    {selectedReviewWord.syllables.map((s, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-0.5 rounded-lg border font-semibold ${
                          selectedReviewWord.stress && selectedReviewWord.stress.includes(idx)
                            ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-300/40'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border-slate-200/50 dark:border-slate-700/50'
                        }`}
                      >
                        {s}
                        {selectedReviewWord.stress &&
                          selectedReviewWord.stress.includes(idx) &&
                          ' ˈ'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Retry Incorrect Button */}
        {onRetryIncorrect && round.results.some((r) => !r.correct) && (
          <button
            className="mt-6 w-full max-w-xs px-5 py-3.5 rounded-2xl bg-[#FF70A6]/20 dark:bg-[#FF70A6]/10 border border-[#FF70A6]/40 text-[#E05080] dark:text-[#FF70A6] font-extrabold text-xs tracking-wider uppercase hover:bg-[#FF70A6]/30 dark:hover:bg-[#FF70A6]/20 active:scale-95 transition-all cursor-pointer btn-3d flex items-center justify-center gap-2"
            onClick={onRetryIncorrect}
            style={{ '--border-color': '#E05080' } as React.CSSProperties}
          >
            <i className="fi fi-sr-refresh text-sm" />
            RETRY INCORRECT ({round.results.filter((r) => !r.correct).length})
          </button>
        )}

        {/* Actions Row */}
        <div className="flex gap-4 mt-6 w-full max-w-xs">
          <button
            id="victory-play-again"
            className="flex-1 px-5 py-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 font-extrabold text-xs tracking-wider uppercase hover:bg-white/80 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer btn-3d"
            onClick={onPlayAgain}
            style={{ '--border-color': 'rgba(0,0,0,0.1)' } as React.CSSProperties}
          >
            PLAY AGAIN
          </button>
          <button
            id="victory-back-to-path"
            className="flex-1 px-5 py-3.5 rounded-2xl bg-[#C8A44E] text-white font-extrabold text-xs tracking-wider uppercase hover:brightness-105 active:scale-95 transition-all cursor-pointer btn-3d shadow-md shadow-[#C8A44E]/20"
            onClick={onBackToPath}
            style={{ '--border-color': '#91722e' } as React.CSSProperties}
          >
            PATH
          </button>
        </div>
      </div>
    </div>
  );
}
