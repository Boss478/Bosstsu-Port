'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { QuizConfig, QuizDirection, CefrLevel, PhonemeData, WordData } from '../types';
import { useAllWordEntries, type WordEntry } from '../hooks/useAllWordEntries';
import { PhonemeSoundboard } from '../components/PhonemeSoundboard';
import { LetterTileKeyboard } from '../components/LetterTileKeyboard';
import QuestionChoiceButton from '../components/QuestionChoiceButton';
import { PHONEMES, WORD_CLASS_ABBREV } from '../constants';
import { DialectBadge } from '../components/DialectBadge';
import { WORDS } from '../words';
import { getWordsForGroup } from '../vocab-group-defs';
import { formatPhonemeIpa } from '../utils/ipaUtils';
import { useAudio } from '@/hooks/useAudio';
import {
  generateDefinitionQuestions,
  generateSynonymQuestions,
  generateAntonymQuestions,
  generateStressQuestions,
} from '../question-generators';

interface Props {
  config: QuizConfig;
  onComplete: (results: { score: number; totalCorrect: number; totalAttempts: number }) => void;
  onBack: () => void;
  onBackToBuilder: () => void;
}

type Phase = 'playing' | 'feedback' | 'results';

interface IpaQuestion {
  kind: 'ipa';
  type: 'word-to-ipa' | 'ipa-to-word';
  word: WordEntry;
}

interface McqWordQuestion {
  kind: 'mcq';
  type: 'word-to-def' | 'def-to-word' | 'synonyms' | 'stress' | 'antonyms';
  correctAnswer: string;
  options: string[];
  word: WordData;
  prompt: string;
  subtitle?: string;
}

type ChallengeQuestion = IpaQuestion | McqWordQuestion;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(
  pool: WordEntry[],
  directions: QuizDirection[],
  count: number,
  cefrLevel?: CefrLevel,
  wordPool?: WordData[],
): ChallengeQuestion[] {
  const ipaDirs = directions.filter((d) => d === 'word-to-ipa' || d === 'ipa-to-word') as (
    | 'word-to-ipa'
    | 'ipa-to-word'
  )[];
  const wordDirs = directions.filter(
    (d) =>
      d === 'word-to-def' ||
      d === 'def-to-word' ||
      d === 'synonyms' ||
      d === 'stress' ||
      d === 'antonyms',
  );

  if (ipaDirs.length === 0 && wordDirs.length === 0) return [];

  const shuffled = pool.length > 0 ? shuffleArray(pool) : [];

  const wordQPool: McqWordQuestion[] = [];
  const mcqCount = wordDirs.length > 0 ? Math.max(10, Math.ceil(count * 0.6)) : 0;

  const lvl = cefrLevel ?? 'all';
  const wp = wordPool ?? WORDS;

  if (wordDirs.includes('word-to-def')) {
    const qs = generateDefinitionQuestions('word-to-def', mcqCount, lvl, undefined, wp);
    wordQPool.push(
      ...qs.map((q) => ({
        kind: 'mcq' as const,
        type: 'word-to-def' as const,
        correctAnswer: q.correctAnswer,
        options: q.options,
        word: q.word,
        prompt: q.word.word,
        subtitle: `Which definition matches "${q.word.word}"?`,
      })),
    );
  }
  if (wordDirs.includes('def-to-word')) {
    const qs = generateDefinitionQuestions('def-to-word', mcqCount, lvl, undefined, wp);
    wordQPool.push(
      ...qs.map((q) => ({
        kind: 'mcq' as const,
        type: 'def-to-word' as const,
        correctAnswer: q.correctAnswer,
        options: q.options,
        word: q.word,
        prompt: q.word.definition,
        subtitle: 'Which word matches this definition?',
      })),
    );
  }
  if (wordDirs.includes('synonyms')) {
    const qs = generateSynonymQuestions(mcqCount, lvl, undefined, wp);
    wordQPool.push(
      ...qs.map((q) => ({
        kind: 'mcq' as const,
        type: 'synonyms' as const,
        correctAnswer: q.correctAnswer,
        options: q.options,
        word: q.word,
        prompt: q.word.word,
        subtitle: `Which is a synonym of "${q.word.word}"?`,
      })),
    );
  }
  if (wordDirs.includes('stress')) {
    const qs = generateStressQuestions(mcqCount, lvl, undefined, wp);
    wordQPool.push(
      ...qs.map((q) => ({
        kind: 'mcq' as const,
        type: 'stress' as const,
        correctAnswer: q.correctAnswer,
        options: q.options,
        word: q.word,
        prompt: q.word.word,
        subtitle: `Which stress pattern matches "${q.word.word}"?`,
      })),
    );
  }
  if (wordDirs.includes('antonyms')) {
    const qs = generateAntonymQuestions(mcqCount, lvl, undefined, wp);
    wordQPool.push(
      ...qs.map((q) => ({
        kind: 'mcq' as const,
        type: 'antonyms' as const,
        correctAnswer: q.correctAnswer,
        options: q.options,
        word: q.word,
        prompt: q.word.word,
        subtitle: `Which is an antonym of "${q.word.word}"?`,
      })),
    );
  }

  const shuffledWordQs = shuffleArray(wordQPool);
  let wordIdx = 0;
  const questions: ChallengeQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const hasIpa = ipaDirs.length > 0;
    const hasWord = wordIdx < shuffledWordQs.length;
    if (!hasIpa && !hasWord) break;

    const pickIpa = hasIpa && (!hasWord || Math.random() < 0.5);
    if (pickIpa) {
      const type = ipaDirs[Math.floor(Math.random() * ipaDirs.length)];
      const word = shuffled[i % shuffled.length];
      if (word) questions.push({ kind: 'ipa', type, word });
    } else if (hasWord) {
      questions.push(shuffledWordQs[wordIdx]);
      wordIdx++;
    }
  }

  return questions;
}

export default function ChallengeQuizScreen({
  config,
  onComplete,
  onBack,
  onBackToBuilder,
}: Props) {
  const { playWordAudio } = useAudio();
  const allWordEntries = useAllWordEntries();

  const quizPool = useMemo(
    () => allWordEntries.filter((w) => w.phonemeIds.length > 0 && w.ipa?.length),
    [allWordEntries],
  );

  const wordPool = useMemo(
    () => (config.groupId ? getWordsForGroup(config.groupId) : undefined),
    [config.groupId],
  );

  const questions = useMemo(() => {
    const count =
      config.mode === 'streak' ? Math.max(100, quizPool.length * 2) : config.roundLength;
    return generateQuestions(quizPool, config.directions, count, config.cefrLevel, wordPool);
  }, [quizPool, config.directions, config.roundLength, config.mode, config.cefrLevel, wordPool]);

  const [phase, setPhase] = useState<Phase>('playing');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [livesLeft, setLivesLeft] = useState(
    config.mode === 'life'
      ? config.lives
      : config.mode === 'hardcore'
        ? 1
        : config.mode === 'streak'
          ? 3
          : 999,
  );
  const [feedbackType, setFeedbackType] = useState<'correct' | 'wrong' | null>(null);
  const [bestStreak, setBestStreak] = useState(0);
  const initTimeLeft =
    config.mode === 'timer'
      ? config.timerPerQuestion
      : config.mode === 'speed-run'
        ? config.speedRunDuration
        : 0;
  const [timeLeft, setTimeLeft] = useState(initTimeLeft);

  const [selectedPhonemes, setSelectedPhonemes] = useState<PhonemeData[]>([]);
  const [typedWord, setTypedWord] = useState('');
  const [mcqAnswer, setMcqAnswer] = useState<string | null>(null);
  const [tapEnabled, setTapEnabled] = useState(true);

  const streakRef = useRef(0);
  const endTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef = useRef(false);

  const currentQuestion = questions[questionIndex] || null;
  const totalQuestions = questions.length;
  const isLastQuestion = config.mode !== 'streak' && questionIndex >= totalQuestions - 1;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Timer mode: per-question countdown
  useEffect(() => {
    if (config.mode !== 'timer' || phase !== 'playing') {
      clearTimer();
      return;
    }
    const duration = config.timerPerQuestion;
    endTimeRef.current = Date.now() + duration * 1000;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearTimer();
        setTapEnabled(false);
        setIncorrect((i) => i + 1);
        streakRef.current = 0;
        setFeedbackType('wrong');
        setPhase('feedback');
      }
    }, 100);
    return clearTimer;
  }, [config.mode, config.timerPerQuestion, phase, questionIndex, clearTimer]);

  // Speed Run mode: global countdown
  useEffect(() => {
    if (config.mode !== 'speed-run' || phase !== 'playing') {
      clearTimer();
      return;
    }
    if (timerRef.current) return;
    endTimeRef.current = Date.now() + config.speedRunDuration * 1000;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearTimer();
        setPhase('results');
      }
    }, 100);
    return clearTimer;
  }, [config.mode, config.speedRunDuration, phase, clearTimer]);

  // Auto-save when results screen is reached
  useEffect(() => {
    if (phase === 'results' && !savedRef.current) {
      savedRef.current = true;
      onComplete({ score, totalCorrect: score, totalAttempts: score + incorrect });
    }
  }, [phase, score, incorrect, onComplete]);

  const submitAnswer = useCallback(() => {
    if (!currentQuestion) return;
    setTapEnabled(false);
    if (config.mode === 'timer') clearTimer();

    let isCorrect = false;

    if (currentQuestion.kind === 'ipa') {
      if (currentQuestion.type === 'word-to-ipa') {
        const userIds = selectedPhonemes.map((p) => p.id);
        const acceptedSets: string[][] = [currentQuestion.word.phonemeIds];
        if (currentQuestion.word.altPhonemeIds) {
          acceptedSets.push(currentQuestion.word.altPhonemeIds);
        }
        for (const set of acceptedSets) {
          if (userIds.length !== set.length) continue;
          const sortedUser = [...userIds].sort().join('|');
          const sortedSet = [...set].sort().join('|');
          if (sortedUser === sortedSet) {
            isCorrect = true;
            break;
          }
        }
      } else {
        const userWord = typedWord.trim().toUpperCase();
        const correctWord = currentQuestion.word.word.toUpperCase();
        isCorrect = userWord === correctWord;
      }
    } else if (currentQuestion.kind === 'mcq') {
      isCorrect = mcqAnswer === currentQuestion.correctAnswer;
    }

    if (isCorrect) {
      setScore((s) => s + 1);
      streakRef.current += 1;
      setBestStreak((b) => Math.max(b, streakRef.current));
      setFeedbackType('correct');

      if (config.mode === 'speed-run') {
        endTimeRef.current += config.speedRunBonus * 1000;
      }
    } else {
      setIncorrect((i) => i + 1);
      streakRef.current = 0;
      setFeedbackType('wrong');
      if (config.mode === 'life' || config.mode === 'hardcore' || config.mode === 'streak') {
        setLivesLeft((l) => l - 1);
      }
    }
    setPhase('feedback');
  }, [currentQuestion, config, selectedPhonemes, typedWord, mcqAnswer, clearTimer]);

  // Auto-advance to results for hardcore/life/streak on game over
  useEffect(() => {
    if (phase !== 'feedback') return;
    if (config.mode === 'hardcore' && feedbackType !== 'correct') {
      const t = setTimeout(() => setPhase('results'), 1500);
      return () => clearTimeout(t);
    }
    if (config.mode === 'life' && livesLeft <= 0) {
      const t = setTimeout(() => setPhase('results'), 1500);
      return () => clearTimeout(t);
    }
    if (config.mode === 'streak' && livesLeft <= 0) {
      const t = setTimeout(() => setPhase('results'), 1500);
      return () => clearTimeout(t);
    }
  }, [phase, config.mode, livesLeft, feedbackType]);

  const handleContinue = useCallback(() => {
    if (phase !== 'feedback') return;
    if (
      (config.mode === 'hardcore' && feedbackType !== 'correct') ||
      (config.mode === 'life' && livesLeft <= 0) ||
      (config.mode === 'streak' && livesLeft <= 0)
    ) {
      setPhase('results');
      return;
    }
    if (config.mode !== 'streak' && isLastQuestion) {
      setPhase('results');
      return;
    }
    setQuestionIndex((i) => i + 1);
    setSelectedPhonemes([]);
    setTypedWord('');
    setMcqAnswer(null);
    setFeedbackType(null);
    setTapEnabled(true);
    setPhase('playing');
  }, [config.mode, livesLeft, feedbackType, isLastQuestion, phase]);

  const handlePlayAgain = useCallback(() => {
    clearTimer();
    setQuestionIndex(0);
    setScore(0);
    setIncorrect(0);
    streakRef.current = 0;
    setBestStreak(0);
    setLivesLeft(
      config.mode === 'life'
        ? config.lives
        : config.mode === 'hardcore'
          ? 1
          : config.mode === 'streak'
            ? 3
            : 999,
    );
    setTimeLeft(0);
    endTimeRef.current = 0;
    savedRef.current = false;
    setSelectedPhonemes([]);
    setTypedWord('');
    setMcqAnswer(null);
    setFeedbackType(null);
    setTapEnabled(true);
    setPhase('playing');
  }, [config.mode, config.lives, clearTimer]);

  const appendLetter = useCallback(
    (char: string) => {
      if (!tapEnabled) return;
      setTypedWord((prev) => (prev + char).toUpperCase());
    },
    [tapEnabled],
  );

  const handleBackspaceKey = useCallback(() => {
    if (!tapEnabled) return;
    setTypedWord((prev) => prev.slice(0, -1));
  }, [tapEnabled]);

  const appendPhoneme = useCallback(
    (p: PhonemeData) => {
      if (!tapEnabled) return;
      setSelectedPhonemes((prev) => [...prev, p]);
    },
    [tapEnabled],
  );

  const removeLastPhoneme = useCallback(() => {
    if (!tapEnabled) return;
    setSelectedPhonemes((prev) => prev.slice(0, -1));
  }, [tapEnabled]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase === 'playing' && !tapEnabled) return;
      if (
        phase === 'playing' &&
        currentQuestion?.kind === 'ipa' &&
        currentQuestion.type === 'ipa-to-word'
      ) {
        const key = e.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
          appendLetter(key);
          return;
        }
        if (e.key === 'Backspace') {
          handleBackspaceKey();
          return;
        }
      }
      if (phase === 'feedback' && e.key === ' ') {
        e.preventDefault();
        handleContinue();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [phase, tapEnabled, currentQuestion, appendLetter, handleBackspaceKey, handleContinue]);

  const isGameOver =
    phase === 'results' ||
    (phase === 'feedback' &&
      ((config.mode === 'hardcore' && feedbackType !== 'correct') ||
        (config.mode === 'life' && livesLeft <= 0) ||
        (config.mode === 'streak' && livesLeft <= 0)));

  const showContinueAsResults = isGameOver || (config.mode !== 'streak' && isLastQuestion);

  function renderIpaQuestion(q: IpaQuestion) {
    if (q.type === 'word-to-ipa') {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Build the IPA for this word
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span
                className="text-3xl font-black text-slate-800 dark:text-[#F7E1A0]"
                style={{ fontFamily: 'var(--font-mali)' }}
              >
                {q.word.word}
              </span>
              {q.word.wordClass && (
                <span className="text-base font-medium text-slate-400 dark:text-slate-500">
                  ({WORD_CLASS_ABBREV[q.word.wordClass.toLowerCase()] ?? q.word.wordClass})
                </span>
              )}
              {q.word.dialect && <DialectBadge dialect={q.word.dialect} />}
            </div>
            <button
              onClick={() => playWordAudio(q.word.word)}
              className="mt-2 w-10 h-10 rounded-xl bg-[#C8A44E]/20 border border-[#C8A44E]/40 text-[#C8A44E] hover:bg-[#C8A44E]/30 transition-colors cursor-pointer flex items-center justify-center mx-auto"
              aria-label="Listen to word"
            >
              <i className="fi fi-sr-volume text-sm" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 min-h-[44px] p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-slate-800/60">
            {selectedPhonemes.length === 0 ? (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold px-2">
                Tap phonemes to build the IPA...
              </span>
            ) : (
              <>
                <span
                  className="text-sm font-black text-slate-800 dark:text-white"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  /{formatPhonemeIpa(selectedPhonemes)}/
                </span>
                <button
                  onClick={removeLastPhoneme}
                  className="px-2 py-1 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-500 hover:text-rose-500 hover:border-rose-300 transition-colors cursor-pointer text-sm"
                  aria-label="Remove last phoneme"
                >
                  &#9003;
                </button>
              </>
            )}
          </div>

          <PhonemeSoundboard
            layoutMode="vertical"
            phonemeLabelMode="both"
            selectedPhonemeIds={selectedPhonemes.map((p) => p.id)}
            onPhonemeClick={appendPhoneme}
            correctPhonemeIds={
              phase === 'feedback'
                ? [...new Set([...q.word.phonemeIds, ...(q.word.altPhonemeIds || [])])]
                : undefined
            }
            disabled={!tapEnabled}
            sortMode="grouped"
            sortOrder="default"
          />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Type the word for this IPA
          </p>
          <p
            className="text-xl font-black text-slate-800 dark:text-white"
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            /{(q.word.ipa || '').replace(/\//g, '')}/
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 min-h-[44px] p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-slate-800/60">
          <input
            type="text"
            value={typedWord}
            onChange={(e) => setTypedWord(e.target.value.toUpperCase())}
            disabled={!tapEnabled}
            className="bg-transparent text-center text-lg font-extrabold text-slate-800 dark:text-[#F7E1A0] outline-none border-none w-full max-w-[200px] disabled:opacity-50"
            style={{ fontFamily: 'var(--font-mali)' }}
            placeholder="Type the word..."
            autoFocus
          />
          {typedWord.length > 0 && (
            <button
              onClick={() => setTypedWord('')}
              className="px-2 py-1 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700/50 text-slate-500 hover:text-rose-500 hover:border-rose-300 transition-colors cursor-pointer"
              aria-label="Clear"
            >
              <i className="fi fi-sr-cross text-[10px]" />
            </button>
          )}
        </div>

        <div className="bg-white/35 dark:bg-slate-900/30 border border-white/40 dark:border-slate-800/50 rounded-3xl p-4 backdrop-blur-md">
          <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-3">
            Letter Tiles
          </p>
          <LetterTileKeyboard
            layout="qwerty"
            onChar={appendLetter}
            onBackspace={handleBackspaceKey}
            disabled={!tapEnabled}
            highlightedKeys={
              phase === 'feedback' ? [...new Set(q.word.word.toUpperCase().split(''))] : undefined
            }
          />
        </div>
      </div>
    );
  }

  function renderMcqQuestion(q: McqWordQuestion) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            {q.subtitle || 'Choose the correct answer'}
          </p>

          {q.type === 'word-to-def' && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span
                className="text-3xl font-black text-slate-800 dark:text-[#F7E1A0]"
                style={{ fontFamily: 'var(--font-mali)' }}
              >
                {q.prompt}
              </span>
              <span className="text-base font-medium text-slate-400 dark:text-slate-500">
                ({WORD_CLASS_ABBREV[q.word.wordClass.toLowerCase()] ?? q.word.wordClass})
              </span>
            </div>
          )}
          {q.type === 'def-to-word' && (
            <div className="glass-panel p-4 rounded-3xl border border-white/20 shadow-sm max-w-sm mx-auto">
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                {q.prompt}
              </p>
              <p className="text-sm italic text-slate-500 dark:text-slate-400 mt-2">
                &ldquo;{q.word.example}&rdquo;
              </p>
            </div>
          )}
          {q.type === 'synonyms' && (
            <>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span
                  className="text-3xl font-black text-slate-800 dark:text-[#F7E1A0]"
                  style={{ fontFamily: 'var(--font-mali)' }}
                >
                  {q.prompt}
                </span>
                <span className="text-base font-medium text-slate-400 dark:text-slate-500">
                  ({WORD_CLASS_ABBREV[q.word.wordClass.toLowerCase()] ?? q.word.wordClass})
                </span>
              </div>
              <button
                onClick={() => playWordAudio(q.word.word)}
                className="mt-2 w-10 h-10 rounded-xl bg-[#C8A44E]/20 border border-[#C8A44E]/40 text-[#C8A44E] hover:bg-[#C8A44E]/30 transition-colors cursor-pointer flex items-center justify-center mx-auto"
                aria-label="Listen to word"
              >
                <i className="fi fi-sr-volume text-sm" />
              </button>
            </>
          )}
          {q.type === 'stress' && (
            <>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span
                  className="text-3xl font-black text-slate-800 dark:text-[#F7E1A0]"
                  style={{ fontFamily: 'var(--font-mali)' }}
                >
                  {q.prompt}
                </span>
                <span className="text-base font-medium text-slate-400 dark:text-slate-500">
                  ({WORD_CLASS_ABBREV[q.word.wordClass.toLowerCase()] ?? q.word.wordClass})
                </span>
              </div>
              <button
                onClick={() => playWordAudio(q.word.word)}
                className="mt-2 w-10 h-10 rounded-xl bg-[#C8A44E]/20 border border-[#C8A44E]/40 text-[#C8A44E] hover:bg-[#C8A44E]/30 transition-colors cursor-pointer flex items-center justify-center mx-auto"
                aria-label="Listen to word"
              >
                <i className="fi fi-sr-volume text-sm" />
              </button>
            </>
          )}
          {q.type === 'antonyms' && (
            <>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span
                  className="text-3xl font-black text-slate-800 dark:text-[#F7E1A0]"
                  style={{ fontFamily: 'var(--font-mali)' }}
                >
                  {q.prompt}
                </span>
                <span className="text-base font-medium text-slate-400 dark:text-slate-500">
                  ({WORD_CLASS_ABBREV[q.word.wordClass.toLowerCase()] ?? q.word.wordClass})
                </span>
              </div>
              <button
                onClick={() => playWordAudio(q.word.word)}
                className="mt-2 w-10 h-10 rounded-xl bg-[#C8A44E]/20 border border-[#C8A44E]/40 text-[#C8A44E] hover:bg-[#C8A44E]/30 transition-colors cursor-pointer flex items-center justify-center mx-auto"
                aria-label="Listen to word"
              >
                <i className="fi fi-sr-volume text-sm" />
              </button>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3.5 max-w-md mx-auto w-full">
          {q.options.map((opt) => (
            <QuestionChoiceButton
              key={opt}
              feedback={phase === 'feedback' ? feedbackType : null}
              selectedAnswer={mcqAnswer}
              correctAnswer={q.correctAnswer}
              value={opt}
              onClick={() => {
                if (!tapEnabled) return;
                setMcqAnswer(opt);
              }}
            >
              <span className="text-sm font-bold">{opt}</span>
            </QuestionChoiceButton>
          ))}
        </div>
      </div>
    );
  }

  function renderFeedback(q: ChallengeQuestion) {
    if (q.kind === 'ipa') {
      if (q.type === 'word-to-ipa') {
        return (
          <div className="text-center">
            {feedbackType === 'correct' ? (
              <>
                <p className="text-4xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  ✓ Correct!
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
                  ✗ Incorrect — The answer of &ldquo;{q.word.word}&rdquo;
                  {q.word.wordClass && (
                    <span className="text-xs font-medium text-rose-500 dark:text-rose-400 ml-1">
                      ({WORD_CLASS_ABBREV[q.word.wordClass.toLowerCase()] ?? q.word.wordClass})
                    </span>
                  )}
                  {q.word.dialect && <span className="ml-1"><DialectBadge dialect={q.word.dialect} /></span>}
                  {' '}=
                </p>
                <p
                  className="text-4xl font-black text-slate-800 dark:text-white mt-2"
                  style={{ fontFamily: 'var(--font-geist-mono)' }}
                >
                  /
                  {q.word.phonemeIds
                    .map((id) => PHONEMES.find((p) => p.id === id))
                    .filter(Boolean)
                    .map((p) => p!.ipa.replace(/\//g, ''))
                    .join(' ')}
                  /
                </p>
              </>
            )}
          </div>
        );
      }
      return (
        <div className="text-center">
          {feedbackType === 'correct' ? (
            <>
              <p className="text-4xl font-extrabold text-emerald-700 dark:text-emerald-300">
                ✓ Correct!
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span
                  className="text-4xl font-black text-slate-800 dark:text-[#F7E1A0]"
                  style={{ fontFamily: 'var(--font-mali)' }}
                >
                  {q.word.word}
                </span>
                {q.word.wordClass && (
                  <span className="text-base font-medium text-slate-400 dark:text-slate-500">
                    ({WORD_CLASS_ABBREV[q.word.wordClass.toLowerCase()] ?? q.word.wordClass})
                  </span>
                )}
                {q.word.dialect && <DialectBadge dialect={q.word.dialect} />}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
                ✗ Incorrect — The answer was:
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span
                  className="text-4xl font-black text-slate-800 dark:text-[#F7E1A0]"
                  style={{ fontFamily: 'var(--font-mali)' }}
                >
                  {q.word.word}
                </span>
                {q.word.wordClass && (
                  <span className="text-base font-medium text-slate-400 dark:text-slate-500">
                    ({WORD_CLASS_ABBREV[q.word.wordClass.toLowerCase()] ?? q.word.wordClass})
                  </span>
                )}
                {q.word.dialect && <DialectBadge dialect={q.word.dialect} />}
              </div>
              <p className="mt-1" style={{ fontFamily: 'var(--font-geist-mono)' }}>
                /{(q.word.ipa || '').replace(/\//g, '')}/
              </p>
            </>
          )}
        </div>
      );
    }

    // MCQ feedback
    return (
      <div className="text-center">
        {feedbackType === 'correct' ? (
          <p className="text-4xl font-extrabold text-emerald-700 dark:text-emerald-300">
            ✓ Correct!
          </p>
        ) : (
          <>
            <p className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
              ✗ Incorrect — The answer was:
            </p>
            <p className="text-lg font-black text-slate-800 dark:text-[#F7E1A0] mt-2">
              {q.correctAnswer}
            </p>
          </>
        )}
      </div>
    );
  }

  const submitDisabled = (() => {
    if (!currentQuestion || phase !== 'playing') return true;
    if (currentQuestion.kind === 'ipa') {
      if (currentQuestion.type === 'word-to-ipa') return selectedPhonemes.length === 0;
      return typedWord.trim().length === 0;
    }
    return mcqAnswer === null;
  })();

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-gradient-to-b from-[#E0F2FE] via-[#F0FDFA] to-[#FEF3C7] dark:from-[#0B132B] dark:via-[#1B254B] dark:to-[#3E1B5D]">
      {(phase === 'playing' || phase === 'feedback') && (
        <>
          <div className="shrink-0 px-5 py-3 flex items-center justify-between border-b border-white/20 dark:border-slate-800/40">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
              aria-label="Back"
            >
              <i className="fi fi-sr-arrow-left text-sm" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-4 text-[10px] font-extrabold tracking-wider">
              <span className="text-emerald-600 dark:text-emerald-400">
                <i className="fi fi-sr-check mr-1" aria-hidden="true" />
                {score}
              </span>
              <span className="text-rose-500 dark:text-rose-400">
                <i className="fi fi-sr-cross mr-1" aria-hidden="true" />
                {incorrect}
              </span>
              {(config.mode === 'life' || config.mode === 'hardcore') && (
                <span className="text-sky-600 dark:text-sky-400">
                  <i className="fi fi-sr-heart mr-1" aria-hidden="true" />
                  {livesLeft}
                </span>
              )}
              {config.mode === 'streak' && (
                <span className="text-amber-500 dark:text-amber-400">
                  <i className="fi fi-sr-flame mr-1" aria-hidden="true" />
                  {bestStreak}
                </span>
              )}
              {config.mode === 'timer' && (
                <span
                  className={`${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  <i className="fi fi-sr-clock mr-1" aria-hidden="true" />
                  {timeLeft}s
                </span>
              )}
              {config.mode === 'speed-run' && (
                <span
                  className={`${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  <i className="fi fi-sr-hourglass mr-1" aria-hidden="true" />
                  {timeLeft}s
                </span>
              )}
              {config.mode !== 'streak' && (
                <span className="text-slate-500 dark:text-slate-400">
                  {questionIndex + 1}/{totalQuestions}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 space-y-4 pt-5">
            <div aria-live="polite" aria-atomic="true">
              {currentQuestion &&
                currentQuestion.kind === 'ipa' &&
                renderIpaQuestion(currentQuestion)}

              {currentQuestion &&
                currentQuestion.kind === 'mcq' &&
                renderMcqQuestion(currentQuestion)}
            </div>

            {phase === 'playing' && (
              <button
                onClick={submitAnswer}
                disabled={submitDisabled}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-extrabold tracking-wider uppercase shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-600 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Check Answer
              </button>
            )}

            {phase === 'feedback' && currentQuestion && (
              <div className="space-y-4">
                <div
                  className={`rounded-2xl p-4 ${
                    feedbackType === 'correct'
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-rose-50 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-700'
                  }`}
                >
                  {renderFeedback(currentQuestion)}
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C8A44E] to-[#D4B06A] text-white text-xs font-extrabold tracking-wider uppercase shadow-lg hover:shadow-xl hover:from-[#D4B06A] hover:to-[#C8A44E] active:scale-[0.97] transition-all cursor-pointer"
                >
                  {showContinueAsResults ? 'See Results' : 'Continue'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {phase === 'results' && (
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="w-full max-w-sm bg-white/95 dark:bg-slate-900/95 border border-white/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[#C8A44E]/20 flex items-center justify-center mx-auto">
              <i
                className={`fi fi-sr-${score >= incorrect ? 'trophy' : 'flag'} text-2xl text-[#C8A44E]`}
              />
            </div>

            <h2
              className="text-lg font-extrabold text-slate-800 dark:text-[#F7E1A0]"
              style={{ fontFamily: 'var(--font-mali)' }}
            >
              Quiz Complete!
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{score}</p>
                <p className="text-[8px] font-extrabold text-emerald-500/70 uppercase tracking-widest">
                  Correct
                </p>
              </div>
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 p-3">
                <p className="text-sm font-black text-rose-600 dark:text-rose-400">{incorrect}</p>
                <p className="text-[8px] font-extrabold text-rose-500/70 uppercase tracking-widest">
                  Incorrect
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3">
              <p className="text-lg font-black text-slate-700 dark:text-slate-200">
                {totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0}%
              </p>
              <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">
                Accuracy
              </p>
            </div>

            {bestStreak > 0 && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                Best streak: {bestStreak}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handlePlayAgain}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#C8A44E] to-[#D4B06A] text-white text-[10px] font-extrabold tracking-wider uppercase shadow-lg hover:shadow-xl active:scale-[0.97] transition-all cursor-pointer"
              >
                Play Again
              </button>
              <button
                onClick={onBack}
                className="w-full py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-[10px] font-extrabold tracking-wider uppercase hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-[0.97] transition-all cursor-pointer"
              >
                Back to Challenge List
              </button>
              <button
                onClick={onBackToBuilder}
                className="w-full py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-[10px] font-extrabold tracking-wider uppercase hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-[0.97] transition-all cursor-pointer"
              >
                Back to Custom Build
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
