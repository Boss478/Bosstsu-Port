import type { QuizDirection, CefrLevel, WordData } from './types';
import type { WordEntry } from '@/lib/word-merge';
import { shuffleArray } from '@/lib/shuffle';
import { WORDS } from './words';
import {
  generateDefinitionQuestions,
  generateSynonymQuestions,
  generateAntonymQuestions,
  generateStressQuestions,
} from './question-generators';

export interface IpaQuestion {
  kind: 'ipa';
  type: 'word-to-ipa' | 'ipa-to-word';
  word: WordEntry;
}

export interface McqWordQuestion {
  kind: 'mcq';
  type: 'word-to-def' | 'def-to-word' | 'synonyms' | 'stress' | 'antonyms';
  correctAnswer: string;
  options: string[];
  word: WordData;
  prompt: string;
  subtitle?: string;
}

export type ChallengeQuestion = IpaQuestion | McqWordQuestion;

export function generateQuestions(
  pool: WordEntry[],
  directions: QuizDirection[],
  count: number,
  cefrLevel?: CefrLevel,
  wordPool?: WordData[],
): ChallengeQuestion[] {
  const ipaDirs = directions.filter((d) => d === 'word-to-ipa' || d === 'ipa-to-word') as (
    'word-to-ipa' | 'ipa-to-word'
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
