import {
  PHONEMES,
  CEFR_LEVEL_ORDER,
  getPhonemeGroup,
  SIMILAR_SOUND_GROUPS,
  CHALLENGE_ROUND_LENGTHS,
  CHALLENGE_TIME_LIMITS,
  PHONEME_TO_GRAPHEMES,
  getAvailableTypesForPhoneme,
} from './constants';
import type {
  PhonicsQuestion,
  SpellingQuestion,
  DefinitionQuestion,
  PracticeQuestion,
  IpaToWordQuestion,
  WordToIpaQuestion,
  ExerciseQuestion,
  SynonymQuestion,
  GraphemePatternQuestion,
  MinimalPairsQuestion,
  StressQuestion,
  PhonemeMatchQuestion,
  SoundSortQuestion,
  RhymeQuestion,
  SpeedSpellQuestion,
  SyllableQuestion,
  PhonicsFormat,
  SpellingFormat,
  DefinitionDirection,
  CardFlipCard,
  Question,
  RoundConfig,
  CefrLevel,
  WordData,
} from './types';
import { WORDS } from './words';

function selectWordByCefr<T extends { level: CefrLevel }>(items: T[], userLevel: CefrLevel): T {
  if (userLevel === 'all' || items.length === 0) {
    return items[Math.floor(Math.random() * items.length)];
  }

  const uIdx = CEFR_LEVEL_ORDER.indexOf(userLevel);
  const same: T[] = [];
  const adj: T[] = [];
  const rest: T[] = [];

  for (const item of items) {
    if (item.level === 'all') {
      same.push(item);
      continue;
    }
    const wIdx = CEFR_LEVEL_ORDER.indexOf(item.level);
    if (wIdx === -1) {
      same.push(item);
      continue;
    }
    const diff = Math.abs(uIdx - wIdx);
    if (diff === 0) same.push(item);
    else if (diff === 1) adj.push(item);
    else rest.push(item);
  }

  const r = Math.random();
  if (r < 0.6 && same.length > 0) return same[Math.floor(Math.random() * same.length)];
  if (r < 0.9 && adj.length > 0) return adj[Math.floor(Math.random() * adj.length)];
  if (rest.length > 0) return rest[Math.floor(Math.random() * rest.length)];
  if (adj.length > 0) return adj[Math.floor(Math.random() * adj.length)];
  if (same.length > 0) return same[Math.floor(Math.random() * same.length)];
  return items[Math.floor(Math.random() * items.length)];
}

function weightedRandomSelect<T>(items: T[], weightFn: (item: T) => number): T {
  const weights = items.map(weightFn);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) {
    return items[Math.floor(Math.random() * items.length)];
  }
  let r = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function generatePhonicsQuestions(
  format: PhonicsFormat,
  count: number,
  userLevel: CefrLevel,
  phonemeIds?: string[],
  words?: WordData[],
): PhonicsQuestion[] {
  const wordPool = words || WORDS;
  const allPhonemes = phonemeIds ? PHONEMES.filter((p) => phonemeIds.includes(p.id)) : PHONEMES;
  const pool = wordPool.filter((w) =>
    w.phonemes.some((p) => allPhonemes.find((ph) => ph.id === p)),
  );
  const questions: PhonicsQuestion[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    const phoneme = allPhonemes[Math.floor(Math.random() * allPhonemes.length)];
    const matching = pool.filter((w) => w.phonemes.includes(phoneme.id) && !used.has(w.word));
    let word = matching.length > 0 ? selectWordByCefr(matching, userLevel) : undefined;

    if (!word) {
      const allMatching = pool.filter((w) => w.phonemes.includes(phoneme.id));
      if (allMatching.length > 0) {
        word = selectWordByCefr(allMatching, userLevel);
      } else {
        word = selectWordByCefr(pool, userLevel);
      }
    }
    if (!word) continue;
    used.add(word.word);

    let distPool = pool.filter((w) => !w.phonemes.includes(phoneme.id) && w.word !== word.word);
    if (distPool.length < 3) {
      distPool = wordPool.filter((w) => !w.phonemes.includes(phoneme.id) && w.word !== word.word);
    }
    const distractors: WordData[] = [];
    const tempDistPool = [...distPool];
    for (let d = 0; d < Math.min(3, tempDistPool.length); d++) {
      const dist = selectWordByCefr(tempDistPool, userLevel);
      distractors.push(dist);
      const idx = tempDistPool.indexOf(dist);
      if (idx !== -1) tempDistPool.splice(idx, 1);
    }

    const options = [word.word, ...distractors.map((d) => d.word)].sort(() => Math.random() - 0.5);

    questions.push({
      category: 'phonics',
      format,
      phoneme,
      word,
      correctAnswer: word.word,
      options,
    });
  }
  return questions;
}

function generateCardFlipCards(
  numPairs: number,
  userLevel: CefrLevel,
  phonemeIds?: string[],
  words?: WordData[],
): CardFlipCard[] {
  const wordPool = words || WORDS;
  const lessonPhonemes =
    phonemeIds && phonemeIds.length > 0 ? PHONEMES.filter((p) => phonemeIds.includes(p.id)) : [];

  const selectedPhonemes = [...lessonPhonemes].sort(() => Math.random() - 0.5);

  if (selectedPhonemes.length < numPairs) {
    const otherPhonemes = PHONEMES.filter(
      (p) => !selectedPhonemes.some((sp) => sp.id === p.id),
    ).sort(() => Math.random() - 0.5);
    const needed = numPairs - selectedPhonemes.length;
    selectedPhonemes.push(...otherPhonemes.slice(0, needed));
  } else if (selectedPhonemes.length > numPairs) {
    selectedPhonemes.splice(numPairs);
  }

  const cards: CardFlipCard[] = [];
  let id = 0;

  for (const phoneme of selectedPhonemes) {
    const matchingWords = wordPool.filter((w) => w.phonemes.includes(phoneme.id));
    const word = matchingWords.length > 0 ? selectWordByCefr(matchingWords, userLevel) : undefined;
    cards.push({
      id: id++,
      type: 'phoneme',
      label: phoneme.ipa,
      ttsText: phoneme.ttsText,
      matchId: phoneme.id,
      flipped: false,
      matched: false,
    });
    cards.push({
      id: id++,
      type: 'word',
      label: word?.word ?? phoneme.example,
      ttsText: word?.word ?? phoneme.example,
      matchId: phoneme.id,
      flipped: false,
      matched: false,
    });
  }

  return cards.sort(() => Math.random() - 0.5);
}

function generateSpellingQuestions(
  format: SpellingFormat,
  count: number,
  userLevel: CefrLevel,
  phonemeIds?: string[],
  words?: WordData[],
): SpellingQuestion[] {
  const wordPool = words || WORDS;
  let pool = [...wordPool];
  if (phonemeIds && phonemeIds.length > 0) {
    pool = pool.filter((w) => w.phonemes.some((p) => phonemeIds.includes(p)));
  }
  if (pool.length === 0) {
    pool = [...wordPool];
  }

  const selected: WordData[] = [];
  const tempPool = [...pool];
  for (let i = 0; i < Math.min(count, tempPool.length); i++) {
    const word = selectWordByCefr(tempPool, userLevel);
    selected.push(word);
    const idx = tempPool.indexOf(word);
    if (idx !== -1) tempPool.splice(idx, 1);
  }

  const questions: SpellingQuestion[] = [];
  for (const word of selected) {
    const inputMode: 'tiles' | 'choice' =
      format === 'mixed' ? (Math.random() > 0.5 ? 'tiles' : 'choice') : format;

    const choices =
      inputMode === 'choice' || format === 'choice'
        ? [word.word, ...word.spellingDistractors].sort(() => Math.random() - 0.5).slice(0, 4)
        : undefined;

    questions.push({
      category: 'spelling',
      format,
      word,
      inputMode,
      choices,
    });
  }

  return questions;
}

function generateDefinitionQuestions(
  direction: DefinitionDirection,
  count: number,
  userLevel: CefrLevel,
  phonemeIds?: string[],
  words?: WordData[],
): DefinitionQuestion[] {
  const wordPool = words || WORDS;
  let pool = [...wordPool];
  if (phonemeIds && phonemeIds.length > 0) {
    pool = pool.filter((w) => w.phonemes.some((p) => phonemeIds.includes(p)));
  }
  if (pool.length === 0) {
    pool = [...wordPool];
  }

  const selected: WordData[] = [];
  const tempPool = [...pool];
  for (let i = 0; i < Math.min(count, tempPool.length); i++) {
    const word = selectWordByCefr(tempPool, userLevel);
    selected.push(word);
    const idx = tempPool.indexOf(word);
    if (idx !== -1) tempPool.splice(idx, 1);
  }

  const questions: DefinitionQuestion[] = [];
  for (const word of selected) {
    let options: string[];
    let correctAnswer: string;

    if (direction === 'def-to-word') {
      let distPool = pool.filter((w) => w.word !== word.word);
      if (distPool.length < 3) {
        distPool = wordPool.filter((w) => w.word !== word.word);
      }
      const distractors: string[] = [];
      const tempDistPool = [...distPool];
      for (let d = 0; d < Math.min(3, tempDistPool.length); d++) {
        const dist = selectWordByCefr(tempDistPool, userLevel);
        distractors.push(dist.word);
        const idx = tempDistPool.indexOf(dist);
        if (idx !== -1) tempDistPool.splice(idx, 1);
      }
      options = [word.word, ...distractors].sort(() => Math.random() - 0.5);
      correctAnswer = word.word;
    } else {
      let distPool = pool.filter((w) => w.word !== word.word);
      if (distPool.length < 3) {
        distPool = wordPool.filter((w) => w.word !== word.word);
      }
      const distractors: string[] = [];
      const tempDistPool = [...distPool];
      for (let d = 0; d < Math.min(3, tempDistPool.length); d++) {
        const dist = selectWordByCefr(tempDistPool, userLevel);
        distractors.push(dist.definition);
        const idx = tempDistPool.indexOf(dist);
        if (idx !== -1) tempDistPool.splice(idx, 1);
      }
      options = [word.definition, ...distractors].sort(() => Math.random() - 0.5);
      correctAnswer = word.definition;
    }

    questions.push({
      category: 'definitions',
      direction,
      word,
      options,
      correctAnswer,
    });
  }

  return questions;
}

function buildPlacementTest30(words?: WordData[]): Question[] {
  const wordPool = words || WORDS;
  const usedWords = new Set<string>();
  const questions: Question[] = [];
  const levels: CefrLevel[] = ['a1', 'a2', 'b1', 'b2'];

  const pickWord = (lvl: CefrLevel): WordData | null => {
    let pool = wordPool.filter((w) => w.level === lvl && !usedWords.has(w.word));
    if (pool.length === 0) pool = wordPool.filter((w) => w.level === lvl);
    if (pool.length === 0) return null;
    const word = pool[Math.floor(Math.random() * pool.length)];
    usedWords.add(word.word);
    return word;
  };

  // 6 def-to-word gap-fill
  for (let i = 0; i < 6; i++) {
    const lvl = levels[i % levels.length];
    const word = pickWord(lvl);
    if (!word) continue;

    const blanked = word.example.replace(new RegExp('\\b' + word.word + '\\b', 'gi'), '____');

    const distractors = wordPool
      .filter((w) => w.word !== word.word && w.level === word.level)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.word);
    const options = [word.word, ...distractors].sort(() => Math.random() - 0.5);

    questions.push({
      category: 'definitions',
      direction: 'def-to-word',
      word,
      options,
      correctAnswer: word.word,
      blankedExample: blanked,
    });
  }

  // 6 word-to-def
  for (let i = 0; i < 6; i++) {
    const lvl = levels[i % levels.length];
    const word = pickWord(lvl);
    if (!word) continue;

    const distractors = wordPool
      .filter((w) => w.word !== word.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.definition);
    const options = [word.definition, ...distractors].sort(() => Math.random() - 0.5);

    questions.push({
      category: 'definitions',
      direction: 'word-to-def',
      word,
      options,
      correctAnswer: word.definition,
    });
  }

  // 6 synonyms
  {
    const synQs = generateSynonymQuestions(6, 'a2', undefined, words);
    questions.push(...synQs);
    synQs.forEach((q) => usedWords.add(q.word.word));
  }

  // 6 IPA→Word
  {
    const ipaQs = generateIpaToWordQuestions(6, 'a1', undefined, words);
    questions.push(...ipaQs);
    ipaQs.forEach((q) => usedWords.add(q.word.word));
  }

  // 6 Word→IPA
  {
    const w2iQs = generateWordToIpaQuestions(6, 'a1', undefined, words);
    questions.push(...w2iQs);
    w2iQs.forEach((q) => usedWords.add(q.word.word));
  }

  // 6 phonics tap
  for (let i = 0; i < 6; i++) {
    const lvl = levels[i % levels.length];
    const word = pickWord(lvl);
    if (!word) continue;

    const phonemeId = word.phonemes[0];
    const phoneme = PHONEMES.find((p) => p.id === phonemeId);
    if (!phoneme) continue;

    const similarPool = wordPool.filter(
      (w) => w.word !== word.word && w.phonemes.some((p) => word.phonemes.includes(p)),
    );
    const distPool =
      similarPool.length >= 3 ? similarPool : wordPool.filter((w) => w.word !== word.word);

    const distractors = [...distPool]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.word);
    const options = [word.word, ...distractors].sort(() => Math.random() - 0.5);

    questions.push({
      category: 'phonics',
      format: 'tap',
      phoneme,
      word,
      correctAnswer: word.word,
      options,
    });
  }

  return questions.sort(() => Math.random() - 0.5);
}

function buildQuestions(
  config: RoundConfig,
  phonemeIds?: string[],
  words?: WordData[],
): Question[] {
  const wordPool = words || WORDS;
  if (config.isPlacement) {
    return buildPlacementTest30(words);
  }

  switch (config.category) {
    case 'phonics': {
      const format = config.phonicsFormat ?? 'tap';
      if (format === 'card-flip') {
        const word = wordPool[0];
        return [
          {
            category: 'phonics' as const,
            format: 'card-flip' as const,
            phoneme: PHONEMES[0],
            word,
            correctAnswer: word.word,
            options: [word.word],
          },
        ];
      }
      return generatePhonicsQuestions(format, config.length, config.level, phonemeIds, words);
    }
    case 'spelling': {
      const format = config.spellingFormat ?? 'choice';
      return generateSpellingQuestions(format, config.length, config.level, phonemeIds, words);
    }
    case 'definitions': {
      const direction = config.definitionDirection ?? 'def-to-word';
      return generateDefinitionQuestions(direction, config.length, config.level, phonemeIds, words);
    }
    case 'practice':
      return generatePracticeQuestions(config.length, config.level, phonemeIds, words);
    case 'ipa-word':
      return generateIpaToWordQuestions(config.length, config.level, phonemeIds, words);
    case 'word-ipa':
      return generateWordToIpaQuestions(config.length, config.level, phonemeIds, words);
    case 'synonyms':
      return generateSynonymQuestions(config.length, config.level, phonemeIds, words);
    case 'grapheme':
      return generateGraphemePatternQuestions(config.length, config.level, phonemeIds, words);
    case 'minimal-pairs':
      return generateMinimalPairsQuestions(config.length, config.level, phonemeIds, words);
    case 'stress':
      return generateStressQuestions(config.length, config.level, phonemeIds, words);
    case 'exercise':
      return generateExerciseQuestions(config.length, config.level, phonemeIds, words);
    case 'vocab-exercise':
      return generateVocabExerciseQuestions(config.length, config.level, phonemeIds, words);
    default:
      return [];
  }
}

function computeCorrectAnswer(q: Question): string {
  if (q.category === 'phonics') return q.correctAnswer;
  if (q.category === 'definitions') return q.correctAnswer;
  if (q.category === 'practice') return q.correctAnswer;
  if (q.category === 'ipa-word') return q.correctAnswer;
  if (q.category === 'word-ipa') return q.correctAnswer;
  if (q.category === 'synonyms') return q.correctAnswer;
  if (q.category === 'exercise') {
    const ex = q as ExerciseQuestion;
    if (ex.data.category === 'ipa-word') return ex.data.correctAnswer;
    if (ex.data.category === 'word-ipa') return ex.data.correctAnswer;
    if (ex.data.category === 'synonyms') return ex.data.correctAnswer;
    return ex.data.correctAnswer;
  }
  if ('inputMode' in q && q.inputMode === 'tiles')
    return (q as SpellingQuestion).word.phonemes.join('');
  if (q.category === 'grapheme' || q.category === 'minimal-pairs' || q.category === 'stress')
    return (q as GraphemePatternQuestion | MinimalPairsQuestion | StressQuestion).correctAnswer;
  return (q as unknown as { word: { word: string } }).word.word;
}

function buildRetryQuestions(
  config: RoundConfig,
  wordStrings: string[],
  words?: WordData[],
  phonemeIds?: string[],
): Question[] {
  const wordPool = words || WORDS;
  const retryWords = wordPool.filter((w) => wordStrings.includes(w.word));
  if (retryWords.length === 0) return [];

  const questions: Question[] = [];

  switch (config.category) {
    case 'phonics': {
      const format = config.phonicsFormat ?? 'tap';
      if (format === 'card-flip') {
        const word = wordPool[0];
        return [
          {
            category: 'phonics' as const,
            format: 'card-flip' as const,
            phoneme: PHONEMES[0],
            word,
            correctAnswer: word.word,
            options: [word.word],
          },
        ];
      }

      for (const word of retryWords) {
        let phonemeId = word.phonemes[0];
        if (phonemeIds && phonemeIds.length > 0) {
          const match = word.phonemes.find((p) => phonemeIds.includes(p));
          if (match) phonemeId = match;
        }
        const phoneme = PHONEMES.find((p) => p.id === phonemeId);
        if (!phoneme) continue;

        let distPool = wordPool.filter(
          (w) => !w.phonemes.includes(phoneme.id) && w.word !== word.word,
        );
        if (distPool.length < 3) {
          distPool = wordPool.filter((w) => w.word !== word.word);
        }
        const distractors: WordData[] = [];
        const tempDistPool = [...distPool];
        for (let d = 0; d < Math.min(3, tempDistPool.length); d++) {
          const dist = selectWordByCefr(tempDistPool, config.level);
          distractors.push(dist);
          const idx = tempDistPool.indexOf(dist);
          if (idx !== -1) tempDistPool.splice(idx, 1);
        }

        questions.push({
          category: 'phonics',
          format,
          phoneme,
          word,
          correctAnswer: word.word,
          options: [word.word, ...distractors.map((d) => d.word)].sort(() => Math.random() - 0.5),
        });
      }
      break;
    }

    case 'spelling': {
      const format = config.spellingFormat ?? 'choice';
      for (const word of retryWords) {
        const inputMode: 'tiles' | 'choice' =
          format === 'mixed' ? (Math.random() > 0.5 ? 'tiles' : 'choice') : format;
        const choices =
          inputMode === 'choice' || format === 'choice'
            ? [word.word, ...word.spellingDistractors].sort(() => Math.random() - 0.5).slice(0, 4)
            : undefined;

        questions.push({
          category: 'spelling',
          format,
          word,
          inputMode,
          choices,
        });
      }
      break;
    }

    case 'definitions': {
      const direction = config.definitionDirection ?? 'def-to-word';
      for (const word of retryWords) {
        let options: string[];
        let correctAnswer: string;

        if (direction === 'def-to-word') {
          let distPool = wordPool.filter((w) => w.word !== word.word);
          if (distPool.length < 3) {
            distPool = wordPool.filter((w) => w.word !== word.word);
          }
          const distractors: string[] = [];
          const tempDistPool = [...distPool];
          for (let d = 0; d < Math.min(3, tempDistPool.length); d++) {
            const dist = selectWordByCefr(tempDistPool, config.level);
            distractors.push(dist.word);
            const idx = tempDistPool.indexOf(dist);
            if (idx !== -1) tempDistPool.splice(idx, 1);
          }
          options = [word.word, ...distractors].sort(() => Math.random() - 0.5);
          correctAnswer = word.word;
        } else {
          let distPool = wordPool.filter((w) => w.word !== word.word);
          if (distPool.length < 3) {
            distPool = wordPool.filter((w) => w.word !== word.word);
          }
          const distractors: string[] = [];
          const tempDistPool = [...distPool];
          for (let d = 0; d < Math.min(3, tempDistPool.length); d++) {
            const dist = selectWordByCefr(tempDistPool, config.level);
            distractors.push(dist.definition);
            const idx = tempDistPool.indexOf(dist);
            if (idx !== -1) tempDistPool.splice(idx, 1);
          }
          options = [word.definition, ...distractors].sort(() => Math.random() - 0.5);
          correctAnswer = word.definition;
        }

        questions.push({
          category: 'definitions',
          direction,
          word,
          options,
          correctAnswer,
        });
      }
      break;
    }

    case 'grapheme':
      return generateGraphemePatternQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    case 'minimal-pairs':
      return generateMinimalPairsQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    case 'stress':
      return generateStressQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    case 'ipa-word':
      return generateIpaToWordQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    case 'word-ipa':
      return generateWordToIpaQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    case 'synonyms':
      return generateSynonymQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    case 'exercise':
      return generateExerciseQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    case 'vocab-exercise':
      return generateVocabExerciseQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
  }

  return questions;
}

// ─── New Generator Functions ─────────────────────────────────────────────────

function getGroupPhonemeIds(phonemeId: string): string[] {
  const group = getPhonemeGroup(phonemeId);
  if (!group) return [phonemeId];
  return group.phonemeIds;
}

function getDistractorsFromSimilarGroup(
  correctWord: WordData,
  phonemeId: string,
  level: CefrLevel,
  count: number,
  words?: WordData[],
): WordData[] {
  const wordPool = words || WORDS;
  const groupPhonemeIds = getGroupPhonemeIds(phonemeId);
  let pool = wordPool.filter(
    (w) =>
      w.word !== correctWord.word &&
      !w.phonemes.includes(phonemeId) &&
      w.phonemes.some((p) => groupPhonemeIds.includes(p)),
  );

  // Fallback: if we don't have enough distractors from the same similar group,
  // draw from general vocabulary excluding the target phoneme.
  if (pool.length < count) {
    const extra = wordPool.filter(
      (w) => w.word !== correctWord.word && !w.phonemes.includes(phonemeId),
    );
    pool = [...pool, ...extra];
  }

  const picked: WordData[] = [];
  const tempPool = [...pool].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(count, tempPool.length); i++) {
    picked.push(tempPool[i]);
  }
  return picked;
}

const VOWEL_PHONEME_IDS = new Set([
  'ae',
  'e',
  'i',
  'o',
  'u',
  'ee',
  'ar',
  'aw',
  'oo',
  'er',
  'ay',
  'ie',
  'oy',
  'ow',
  'oh',
  'uh',
  'eer',
  'air',
  'oor',
  'uh2',
]);

function getRime(phonemes: string[]): string {
  const lastVowelIdx = phonemes.findLastIndex((p) => VOWEL_PHONEME_IDS.has(p));
  if (lastVowelIdx === -1) return phonemes.join('');
  return phonemes.slice(lastVowelIdx).join('');
}

function generatePhonemeMatchRound(
  difficulty: 'easy' | 'medium' | 'hard',
  level: CefrLevel,
): PhonemeMatchQuestion {
  const gridSize = CHALLENGE_ROUND_LENGTHS['phoneme-match'][difficulty];
  const pairs: { phonemeId: string; ipa: string; word: string }[] = [];
  const usedPhonemes = new Set<string>();

  let pool = [...WORDS];
  if (level !== 'all') {
    const lvlOrder: CefrLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
    const lvlIdx = lvlOrder.indexOf(level);
    const maxIdx = Math.min(lvlIdx + 2, lvlOrder.length - 1);
    const allowedLevels = lvlOrder.slice(0, maxIdx + 1);
    pool = pool.filter((w) => allowedLevels.includes(w.level));
  }

  for (let i = 0; i < gridSize; i++) {
    const availablePhonemes = PHONEMES.filter((p) => !usedPhonemes.has(p.id));
    if (availablePhonemes.length === 0) break;
    const phoneme = availablePhonemes[Math.floor(Math.random() * availablePhonemes.length)];
    usedPhonemes.add(phoneme.id);

    const matchingWords = pool.filter((w) => w.phonemes.includes(phoneme.id));
    if (matchingWords.length === 0) continue;
    const word = matchingWords[Math.floor(Math.random() * matchingWords.length)];

    pairs.push({ phonemeId: phoneme.id, ipa: phoneme.ipa, word: word.word });
  }

  return { category: 'phoneme-match', pairs, gridSize: pairs.length };
}

function generateSoundSortQuestions(count: number, level: CefrLevel): SoundSortQuestion[] {
  const questions: SoundSortQuestion[] = [];
  const groups = [...SIMILAR_SOUND_GROUPS].sort(() => Math.random() - 0.5);

  let pool = [...WORDS];
  if (level !== 'all') {
    const lvlOrder: CefrLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
    const lvlIdx = lvlOrder.indexOf(level);
    const maxIdx = Math.min(lvlIdx + 2, lvlOrder.length - 1);
    const allowedLevels = lvlOrder.slice(0, maxIdx + 1);
    pool = pool.filter((w) => allowedLevels.includes(w.level));
  }

  for (let q = 0; q < count; q++) {
    const numGroups = 2 + Math.floor(Math.random() * 2);
    const selectedGroups = groups.slice(q % groups.length, (q % groups.length) + numGroups);
    if (selectedGroups.length < 2) continue;

    const targetPhonemeIds = selectedGroups.flatMap((g) => g.phonemeIds);
    const words: { word: string; correctGroup: string }[] = [];
    const usedWords = new Set<string>();

    for (const group of selectedGroups) {
      const groupWords = pool.filter(
        (w) => w.phonemes.some((p) => group.phonemeIds.includes(p)) && !usedWords.has(w.word),
      );
      const take = Math.min(3 + Math.floor(Math.random() * 2), groupWords.length);
      for (let i = 0; i < take; i++) {
        const w = groupWords[i];
        words.push({ word: w.word, correctGroup: group.id });
        usedWords.add(w.word);
      }
    }

    if (words.length < 4) continue;

    questions.push({
      category: 'sound-sort',
      targetPhonemeIds,
      words: words.sort(() => Math.random() - 0.5),
    });
  }

  return questions;
}

function generateRhymeTimeQuestions(count: number, level: CefrLevel): RhymeQuestion[] {
  const questions: RhymeQuestion[] = [];
  const usedWords = new Set<string>();

  let pool = [...WORDS];
  if (level !== 'all') {
    const lvlOrder: CefrLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
    const lvlIdx = lvlOrder.indexOf(level);
    const maxIdx = Math.min(lvlIdx + 2, lvlOrder.length - 1);
    const allowedLevels = lvlOrder.slice(0, maxIdx + 1);
    pool = pool.filter((w) => allowedLevels.includes(w.level));
  }

  for (let i = 0; i < count; i++) {
    const available = pool.filter((w) => !usedWords.has(w.word));
    if (available.length === 0) continue;
    const target = weightedRandomSelect(available, () => 1);
    if (!target) continue;
    usedWords.add(target.word);

    const rime = getRime(target.phonemes);

    const rhymingPool = pool.filter(
      (w) =>
        w.word !== target.word &&
        !usedWords.has(w.word) &&
        w.phonemes.length >= 2 &&
        getRime(w.phonemes) === rime,
    );

    let correctAnswer: string;
    let options: string[];

    if (rhymingPool.length > 0) {
      const rhymeWord = rhymingPool[Math.floor(Math.random() * rhymingPool.length)];
      correctAnswer = rhymeWord.word;
      usedWords.add(rhymeWord.word);

      const distPool = pool.filter(
        (w) => w.word !== target.word && w.word !== rhymeWord.word && !usedWords.has(w.word),
      );
      const distractors: string[] = [];
      const tempDist = [...distPool].sort(() => Math.random() - 0.5);
      for (let d = 0; d < Math.min(3, tempDist.length); d++) {
        distractors.push(tempDist[d].word);
      }
      while (distractors.length < 3) {
        const extra = WORDS[Math.floor(Math.random() * WORDS.length)];
        if (!distractors.includes(extra.word)) distractors.push(extra.word);
      }
      options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
    } else {
      const group = getPhonemeGroup(target.phonemes[target.phonemes.length - 1]);
      const similarPool = group
        ? pool.filter(
            (w) =>
              w.word !== target.word &&
              !usedWords.has(w.word) &&
              w.phonemes.some((p) => group.phonemeIds.includes(p)),
          )
        : pool.filter((w) => w.word !== target.word && !usedWords.has(w.word));
      if (similarPool.length === 0) continue;
      const similarWord = similarPool[Math.floor(Math.random() * similarPool.length)];
      correctAnswer = similarWord.word;
      usedWords.add(similarWord.word);

      const distractors: string[] = [];
      const tempDist = pool
        .filter(
          (w) => w.word !== target.word && w.word !== similarWord.word && !usedWords.has(w.word),
        )
        .sort(() => Math.random() - 0.5);
      for (let d = 0; d < Math.min(3, tempDist.length); d++) {
        distractors.push(tempDist[d].word);
      }
      while (distractors.length < 3) {
        const extra = WORDS[Math.floor(Math.random() * WORDS.length)];
        if (!distractors.includes(extra.word)) distractors.push(extra.word);
      }
      options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
    }

    questions.push({
      category: 'rhyme-time',
      targetWord: target.word,
      targetIpa: target.ipa,
      options,
      correctAnswer,
    });
  }

  return questions;
}

function generateSpeedSpellQuestions(
  count: number,
  level: CefrLevel,
  difficulty: 'easy' | 'medium' | 'hard',
): SpeedSpellQuestion[] {
  const timeLimitMs = CHALLENGE_TIME_LIMITS['speed-spell'][difficulty];
  const questions: SpeedSpellQuestion[] = [];
  const usedWords = new Set<string>();

  let pool = [...WORDS];
  if (level !== 'all') {
    const lvlOrder: CefrLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
    const lvlIdx = lvlOrder.indexOf(level);
    const maxIdx = Math.min(lvlIdx + 2, lvlOrder.length - 1);
    const allowedLevels = lvlOrder.slice(0, maxIdx + 1);
    pool = pool.filter((w) => allowedLevels.includes(w.level));
  }
  pool = pool.filter((w) => w.word.length >= 3 && w.word.length <= 8);

  for (let i = 0; i < count; i++) {
    const word = weightedRandomSelect(
      pool.filter((w) => !usedWords.has(w.word)),
      () => 1,
    );
    if (!word) continue;
    usedWords.add(word.word);
    questions.push({ category: 'speed-spell', word, timeLimitMs });
  }

  return questions;
}

function generateSyllableSmashQuestions(count: number, level: CefrLevel): SyllableQuestion[] {
  const questions: SyllableQuestion[] = [];
  const usedWords = new Set<string>();

  let pool = [...WORDS];
  if (level !== 'all') {
    const lvlOrder: CefrLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
    const lvlIdx = lvlOrder.indexOf(level);
    const maxIdx = Math.min(lvlIdx + 2, lvlOrder.length - 1);
    const allowedLevels = lvlOrder.slice(0, maxIdx + 1);
    pool = pool.filter((w) => allowedLevels.includes(w.level));
  }
  pool = pool.filter((w) => w.syllables.length >= 1 && w.syllables.length <= 5);

  for (let i = 0; i < count; i++) {
    const word = weightedRandomSelect(
      pool.filter((w) => !usedWords.has(w.word)),
      () => 1,
    );
    if (!word) continue;
    usedWords.add(word.word);

    const correctCount = word.syllables.length;
    const optionSet = new Set<number>();
    optionSet.add(correctCount);
    while (optionSet.size < 4) {
      const offset = Math.floor(Math.random() * 5) - 2;
      const candidate = Math.max(1, Math.min(6, correctCount + offset));
      optionSet.add(candidate);
    }

    questions.push({
      category: 'syllable-smash',
      word: word.word,
      syllableCount: correctCount,
      options: [...optionSet].sort(() => Math.random() - 0.5),
      correctAnswer: correctCount,
    });
  }

  return questions;
}

function generatePracticeQuestions(
  count: number,
  level: CefrLevel,
  phonemeIds?: string[],
  words?: WordData[],
): PracticeQuestion[] {
  const wordPool = words || WORDS;
  const allPhonemes = phonemeIds ? PHONEMES.filter((p) => phonemeIds.includes(p.id)) : PHONEMES;
  const pool = wordPool.filter((w) =>
    w.phonemes.some((p) => allPhonemes.find((ph) => ph.id === p)),
  );
  const questions: PracticeQuestion[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    const phoneme = allPhonemes[Math.floor(Math.random() * allPhonemes.length)];
    const matching = pool.filter((w) => w.phonemes.includes(phoneme.id) && !used.has(w.word));
    let word = matching.length > 0 ? selectWordByCefr(matching, level) : undefined;
    if (!word) {
      const allM = pool.filter((w) => w.phonemes.includes(phoneme.id));
      if (allM.length > 0) {
        word = selectWordByCefr(allM, level);
      } else {
        word = selectWordByCefr(pool, level);
      }
    }
    if (!word) continue;
    used.add(word.word);

    const distractors = getDistractorsFromSimilarGroup(word, phoneme.id, level, 3, words);
    const options = [word.word, ...distractors.map((d) => d.word)].sort(() => Math.random() - 0.5);

    questions.push({
      category: 'practice',
      phoneme,
      word,
      correctAnswer: word.word,
      options,
    });
  }
  return questions;
}

function generateIpaToWordQuestions(
  count: number,
  level: CefrLevel,
  phonemeIds?: string[],
  words?: WordData[],
): IpaToWordQuestion[] {
  const wordPool = words || WORDS;
  const pool = phonemeIds?.length
    ? wordPool.filter((w) => w.phonemes.some((p) => phonemeIds.includes(p)))
    : wordPool;
  const questions: IpaToWordQuestion[] = [];
  const used = new Set<string>();

  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const word = selectWordByCefr(
      pool.filter((w) => !used.has(w.word)),
      level,
    );
    if (!word) continue;
    used.add(word.word);

    let phonemeId = word.phonemes[0];
    if (phonemeIds && phonemeIds.length > 0) {
      const match = word.phonemes.find((p) => phonemeIds.includes(p));
      if (match) phonemeId = match;
    }
    const phoneme = PHONEMES.find((p) => p.id === phonemeId);
    if (!phoneme) continue;

    const distractors = getDistractorsFromSimilarGroup(word, phonemeId, level, 3, words);
    const options = [word.word, ...distractors.map((d) => d.word)].sort(() => Math.random() - 0.5);

    questions.push({
      category: 'ipa-word',
      ipa: phoneme.ipa,
      correctAnswer: word.word,
      options,
      phoneme,
      word,
    });
  }
  // If we didn't generate enough, fill up
  while (questions.length < count) {
    const w = wordPool[Math.floor(Math.random() * wordPool.length)];
    if (used.has(w.word)) continue;
    used.add(w.word);
    let pid = w.phonemes[0];
    if (phonemeIds && phonemeIds.length > 0) {
      const match = w.phonemes.find((p) => phonemeIds.includes(p));
      if (match) pid = match;
    }
    const ph = PHONEMES.find((p) => p.id === pid);
    if (!ph) continue;
    const dists = getDistractorsFromSimilarGroup(w, pid, level, 3, words);
    questions.push({
      category: 'ipa-word',
      ipa: ph.ipa,
      correctAnswer: w.word,
      options: [w.word, ...dists.map((d) => d.word)].sort(() => Math.random() - 0.5),
      phoneme: ph,
      word: w,
    });
  }
  return questions.slice(0, count);
}

function generateWordToIpaQuestions(
  count: number,
  level: CefrLevel,
  phonemeIds?: string[],
  words?: WordData[],
): WordToIpaQuestion[] {
  const wordPool = words || WORDS;
  const pool = phonemeIds?.length
    ? wordPool.filter((w) => w.phonemes.some((p) => phonemeIds.includes(p)))
    : wordPool;
  const questions: WordToIpaQuestion[] = [];
  const used = new Set<string>();

  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const word = selectWordByCefr(
      pool.filter((w) => !used.has(w.word)),
      level,
    );
    if (!word) continue;
    used.add(word.word);

    let phonemeId = word.phonemes[0];
    if (phonemeIds && phonemeIds.length > 0) {
      const match = word.phonemes.find((p) => phonemeIds.includes(p));
      if (match) phonemeId = match;
    }
    const correctPhoneme = PHONEMES.find((p) => p.id === phonemeId);
    if (!correctPhoneme) continue;

    const groupIds = getGroupPhonemeIds(phonemeId);
    const distractorPhonemes = PHONEMES.filter(
      (p) => groupIds.includes(p.id) && p.id !== phonemeId,
    );
    const options: string[] = [correctPhoneme.ipa];
    const tempDists = [...distractorPhonemes].sort(() => Math.random() - 0.5);
    for (let d = 0; d < Math.min(3, tempDists.length); d++) {
      options.push(tempDists[d].ipa);
    }
    while (options.length < 4) {
      const extra = PHONEMES[Math.floor(Math.random() * PHONEMES.length)];
      if (!options.includes(extra.ipa)) options.push(extra.ipa);
    }

    questions.push({
      category: 'word-ipa',
      word,
      correctAnswer: correctPhoneme.ipa,
      options: options.sort(() => Math.random() - 0.5),
    });
  }
  while (questions.length < count) {
    const w = wordPool[Math.floor(Math.random() * wordPool.length)];
    if (used.has(w.word)) continue;
    used.add(w.word);
    let pid = w.phonemes[0];
    if (phonemeIds && phonemeIds.length > 0) {
      const match = w.phonemes.find((p) => phonemeIds.includes(p));
      if (match) pid = match;
    }
    const ph = PHONEMES.find((p) => p.id === pid);
    if (!ph) continue;
    const options = [ph.ipa];
    const group = getPhonemeGroup(pid);
    const dists = group
      ? PHONEMES.filter((p) => group.phonemeIds.includes(p.id) && p.id !== pid)
      : PHONEMES.filter((p) => p.id !== pid);
    const tempD = [...dists].sort(() => Math.random() - 0.5).slice(0, 3);
    tempD.forEach((d) => options.push(d.ipa));
    while (options.length < 4) {
      const extra = PHONEMES[Math.floor(Math.random() * PHONEMES.length)];
      if (!options.includes(extra.ipa)) options.push(extra.ipa);
    }
    questions.push({
      category: 'word-ipa',
      word: w,
      correctAnswer: ph.ipa,
      options: options.sort(() => Math.random() - 0.5),
    });
  }
  return questions.slice(0, count);
}

function generateSynonymQuestions(
  count: number,
  level: CefrLevel,
  phonemeIds?: string[],
  words?: WordData[],
): SynonymQuestion[] {
  const wordPool = words || WORDS;
  let pool = [...wordPool];
  if (phonemeIds?.length) {
    pool = pool.filter((w) => w.phonemes.some((p) => phonemeIds.includes(p)));
  }
  pool = pool.filter((w) => w.synonyms.length >= 3);
  if (pool.length === 0) pool = wordPool.filter((w) => w.synonyms.length >= 1);

  const questions: SynonymQuestion[] = [];
  const used = new Set<string>();

  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const word = selectWordByCefr(
      pool.filter((w) => !used.has(w.word)),
      level,
    );
    if (!word) continue;
    used.add(word.word);

    const options: string[] = [];
    if (word.synonyms.length > 0) {
      const correctSyn = word.synonyms[Math.floor(Math.random() * word.synonyms.length)];
      options.push(correctSyn);
      const distPool = wordPool.filter(
        (w) => w.word !== word.word && !word.synonyms.includes(w.word) && !options.includes(w.word),
      );
      const tempDist = [...distPool].sort(() => Math.random() - 0.5);
      for (let d = 0; d < Math.min(3, tempDist.length); d++) {
        options.push(tempDist[d].word);
      }
      while (options.length < 4) {
        options.push(wordPool[Math.floor(Math.random() * wordPool.length)].word);
      }
      questions.push({
        category: 'synonyms',
        word,
        correctAnswer: correctSyn,
        options: [...new Set(options)].sort(() => Math.random() - 0.5),
      });
    }
  }
  return questions;
}

function generateGraphemePatternQuestions(
  count: number,
  level: CefrLevel,
  phonemeIds?: string[],
  words?: WordData[],
): GraphemePatternQuestion[] {
  const questions: GraphemePatternQuestion[] = [];
  const wordPool = words || WORDS;
  const targetPhonemeIds = phonemeIds?.length ? phonemeIds : PHONEMES.map((p) => p.id);

  for (let i = 0; i < count; i++) {
    const phonemeId = targetPhonemeIds[i % targetPhonemeIds.length];
    const graphemes = PHONEME_TO_GRAPHEMES[phonemeId];
    if (!graphemes?.length) continue;

    const direction = i % 2 === 0 ? 'phoneme-to-grapheme' : 'grapheme-to-phoneme';

    const wordPoolForPhoneme = wordPool.filter((w) => w.phonemes.includes(phonemeId));
    const exampleWord =
      wordPoolForPhoneme.length > 0 ? wordPoolForPhoneme[i % wordPoolForPhoneme.length] : undefined;

    if (direction === 'phoneme-to-grapheme') {
      const correctGrapheme = graphemes[i % graphemes.length];

      const phoneme = PHONEMES.find((p) => p.id === phonemeId);
      if (!phoneme) continue;

      const distractorPool: string[] = [];
      for (const [pid, gs] of Object.entries(PHONEME_TO_GRAPHEMES)) {
        if (pid === phonemeId) continue;
        for (const g of gs) {
          if (g !== correctGrapheme) distractorPool.push(g);
        }
      }
      const distractors = [...new Set(distractorPool)].sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [correctGrapheme, ...distractors].sort(() => Math.random() - 0.5);

      questions.push({
        category: 'grapheme',
        direction: 'phoneme-to-grapheme',
        promptLabel: phoneme.ipa,
        correctAnswer: correctGrapheme,
        options,
        phonemeId,
        word: exampleWord,
      });
    } else {
      const correctGrapheme = graphemes[i % graphemes.length];

      const phoneme = PHONEMES.find((p) => p.id === phonemeId);
      if (!phoneme) continue;

      const distractorPhonemes = PHONEMES.filter(
        (p) => p.id !== phonemeId && PHONEME_TO_GRAPHEMES[p.id]?.some((g) => g === correctGrapheme),
      );
      const distractorIpas = distractorPhonemes.map((p) => p.ipa);
      const options = [phoneme.ipa, ...distractorIpas];
      while (options.length < 4) {
        const extra = PHONEMES[Math.floor(Math.random() * PHONEMES.length)];
        if (!options.includes(extra.ipa)) options.push(extra.ipa);
      }

      questions.push({
        category: 'grapheme',
        direction: 'grapheme-to-phoneme',
        promptLabel: correctGrapheme,
        correctAnswer: phoneme.ipa,
        options: options.sort(() => Math.random() - 0.5),
        phonemeId,
        word: exampleWord,
      });
    }
  }
  return questions.slice(0, count);
}

function generateMinimalPairsQuestions(
  count: number,
  level: CefrLevel,
  phonemeIds?: string[],
  words?: WordData[],
): MinimalPairsQuestion[] {
  const wordPool = words || WORDS;
  const allIds = phonemeIds?.length ? phonemeIds : PHONEMES.map((p) => p.id);
  const targetIds = allIds.filter((id) => wordPool.some((w) => w.phonemes.includes(id)));
  if (targetIds.length === 0) return [];
  const questions: MinimalPairsQuestion[] = [];
  const used = new Set<string>();

  for (const pid of targetIds) {
    const pool = wordPool.filter((w) => w.phonemes.includes(pid) && w.phonemes.length >= 2);
    for (const wordA of pool) {
      for (const wordB of pool) {
        if (wordA.word === wordB.word) continue;
        const diffCount = wordA.phonemes.filter((p, idx) => p !== wordB.phonemes[idx]).length;
        if (diffCount === 1) {
          const direction = questions.length % 2 === 0 ? 'word-to-ipa' : 'ipa-to-word';
          const key = [wordA.word, wordB.word].sort().join(':');
          if (used.has(key)) continue;
          used.add(key);

          if (direction === 'word-to-ipa') {
            const options = [wordA.ipa, wordB.ipa];
            const extra = wordPool.filter((w) => !options.includes(w.ipa) && w.word !== wordA.word);
            const tempExtra = [...extra].sort(() => Math.random() - 0.5);
            for (let e = 0; e < Math.min(2, tempExtra.length); e++) {
              options.push(tempExtra[e].ipa);
            }
            while (options.length < 4) {
              options.push(wordPool[Math.floor(Math.random() * wordPool.length)].ipa);
            }
            questions.push({
              category: 'minimal-pairs',
              direction: 'word-to-ipa',
              prompt: wordA.word,
              correctAnswer: wordA.ipa,
              options: [...new Set(options)].sort(() => Math.random() - 0.5),
              phonemeId: pid,
              word: wordA,
            });
          } else {
            const options = [wordA.word, wordB.word];
            const extra = wordPool.filter(
              (w) => !options.includes(w.word) && w.word !== wordA.word,
            );
            const tempExtra = [...extra].sort(() => Math.random() - 0.5);
            for (let e = 0; e < Math.min(2, tempExtra.length); e++) {
              options.push(tempExtra[e].word);
            }
            while (options.length < 4) {
              options.push(wordPool[Math.floor(Math.random() * wordPool.length)].word);
            }
            questions.push({
              category: 'minimal-pairs',
              direction: 'ipa-to-word',
              prompt: wordA.ipa,
              correctAnswer: wordA.word,
              options: [...new Set(options)].sort(() => Math.random() - 0.5),
              phonemeId: pid,
              word: wordA,
            });
          }
          if (questions.length >= count) break;
        }
      }
      if (questions.length >= count) break;
    }
    if (questions.length >= count) break;
  }

  let fallbackIters = 0;
  while (questions.length < count) {
    if (fallbackIters++ > count * 100) break;
    const pid = targetIds[questions.length % targetIds.length];
    const pool = wordPool.filter((w) => w.phonemes.includes(pid));
    if (pool.length === 0) continue;
    const word = pool[Math.floor(Math.random() * pool.length)];
    const groupIds = getGroupPhonemeIds(pid);
    const distractorPhonemes = PHONEMES.filter((p) => groupIds.includes(p.id) && p.id !== pid).sort(
      () => Math.random() - 0.5,
    );
    const distractorIpas = distractorPhonemes.slice(0, 3).map((p) => p.ipa);
    const options = [word.ipa, ...distractorIpas];
    while (options.length < 4) {
      const extra = PHONEMES[Math.floor(Math.random() * PHONEMES.length)];
      if (!options.includes(extra.ipa)) options.push(extra.ipa);
    }
    questions.push({
      category: 'minimal-pairs',
      direction: 'word-to-ipa',
      prompt: word.word,
      correctAnswer: word.ipa,
      options: options.sort(() => Math.random() - 0.5),
      phonemeId: pid,
      word,
    });
  }

  return questions.slice(0, count);
}

function generateStressQuestions(
  count: number,
  level: CefrLevel,
  phonemeIds?: string[],
  words?: WordData[],
): StressQuestion[] {
  const wordPool = words || WORDS;
  const targetIds = phonemeIds?.length ? phonemeIds : PHONEMES.map((p) => p.id);
  let pool = wordPool.filter(
    (w) => (w.stress?.length ?? 0) >= 2 && w.phonemes.some((p) => targetIds.includes(p)),
  );
  if (pool.length < count) {
    const expanded = wordPool.filter((w) => (w.stress?.length ?? 0) >= 2);
    pool = [...new Set([...pool, ...expanded])];
  }
  const questions: StressQuestion[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    const word = selectWordByCefr(
      pool.filter((w) => !used.has(w.word)),
      level,
    );
    if (!word) continue;
    used.add(word.word);

    const syllables = word.syllables;
    const stress = word.stress;
    if (!syllables?.length || !stress?.length || stress.length !== syllables.length) continue;

    const options: string[] = [];
    for (let s = 0; s < stress.length; s++) {
      const parts = syllables.map((sy, idx) => (idx === s ? `ˈ${sy}` : sy));
      options.push(`/${parts.join(' ')}/`);
    }
    const correctIdx = stress.indexOf(1);
    if (correctIdx === -1) continue;

    let phonemeId = word.phonemes[0];
    if (phonemeIds && phonemeIds.length > 0) {
      const match = word.phonemes.find((p) => phonemeIds.includes(p));
      if (match) phonemeId = match;
    }

    questions.push({
      category: 'stress',
      word,
      correctAnswer: options[correctIdx],
      options: options.sort(() => Math.random() - 0.5),
      phonemeId,
    });
  }

  return questions;
}

function generateExerciseQuestions(
  count: number,
  level: CefrLevel,
  phonemeIds?: string[],
  words?: WordData[],
): ExerciseQuestion[] {
  let FORMATS: ('grapheme' | 'ipa-word' | 'word-ipa' | 'minimal-pairs' | 'stress')[] = [
    'grapheme',
    'ipa-word',
    'word-ipa',
    'minimal-pairs',
    'stress',
  ];
  let RATIOS = [6, 4, 4, 6, 5];

  if (phonemeIds?.length === 1) {
    const availableTypes = getAvailableTypesForPhoneme(phonemeIds[0]);
    const availableSet = new Set(availableTypes.filter((t) => t !== 'exercise'));
    const filtered: typeof FORMATS = [];
    const filteredRatios: number[] = [];
    FORMATS.forEach((f, i) => {
      if (availableSet.has(f)) {
        filtered.push(f);
        filteredRatios.push(RATIOS[i]);
      }
    });
    FORMATS = filtered;
    RATIOS = filteredRatios;
  }

  if (FORMATS.length === 0) return [];

  const totalRatio = RATIOS.reduce((a, b) => a + b, 0);

  const counts = FORMATS.map((_, i) => Math.round((count * RATIOS[i]) / totalRatio));
  const diff = count - counts.reduce((a, b) => a + b, 0);
  if (diff !== 0) {
    const lastIdx = counts.length - 1;
    counts[lastIdx] += diff;
  }

  const questions: ExerciseQuestion[] = [];

  for (let i = 0; i < FORMATS.length; i++) {
    const subType = FORMATS[i];
    const qCount = counts[i];
    for (let j = 0; j < qCount; j++) {
      switch (subType) {
        case 'grapheme': {
          const qs = generateGraphemePatternQuestions(1, level, phonemeIds, words);
          if (qs.length > 0) {
            questions.push({ category: 'exercise', subType, data: qs[0] });
          }
          break;
        }
        case 'ipa-word': {
          const qs = generateIpaToWordQuestions(1, level, phonemeIds, words);
          if (qs.length > 0) {
            questions.push({ category: 'exercise', subType, data: qs[0] });
          }
          break;
        }
        case 'word-ipa': {
          const qs = generateWordToIpaQuestions(1, level, phonemeIds, words);
          if (qs.length > 0) {
            questions.push({ category: 'exercise', subType, data: qs[0] });
          }
          break;
        }
        case 'minimal-pairs': {
          const qs = generateMinimalPairsQuestions(1, level, phonemeIds, words);
          if (qs.length > 0) {
            questions.push({ category: 'exercise', subType, data: qs[0] });
          }
          break;
        }
        case 'stress': {
          const qs = generateStressQuestions(1, level, phonemeIds, words);
          if (qs.length > 0) {
            questions.push({ category: 'exercise', subType, data: qs[0] });
          }
          break;
        }
      }
    }
  }

  return questions.sort(() => Math.random() - 0.5);
}

function generateVocabExerciseQuestions(
  count: number,
  level: CefrLevel,
  phonemeIds?: string[],
  words?: WordData[],
): (DefinitionQuestion | SynonymQuestion)[] {
  const formats: ('def-to-word' | 'word-to-def' | 'synonyms')[] = [
    'def-to-word',
    'word-to-def',
    'synonyms',
  ];
  const questions: (DefinitionQuestion | SynonymQuestion)[] = [];

  for (let i = 0; i < count; i++) {
    const subType = formats[i % formats.length];
    switch (subType) {
      case 'def-to-word': {
        const qs = generateDefinitionQuestions('def-to-word', 1, level, phonemeIds, words);
        if (qs.length > 0) questions.push(qs[0]);
        break;
      }
      case 'word-to-def': {
        const qs = generateDefinitionQuestions('word-to-def', 1, level, phonemeIds, words);
        if (qs.length > 0) questions.push(qs[0]);
        break;
      }
      case 'synonyms': {
        const qs = generateSynonymQuestions(1, level, phonemeIds, words);
        if (qs.length > 0) questions.push(qs[0]);
        break;
      }
    }
  }
  return questions;
}

function buildActivityRetryQuestions(
  config: RoundConfig,
  wordStrings: string[],
  words?: WordData[],
): Question[] {
  const wordPool = words || WORDS;
  const retryWords = wordPool.filter((w) => wordStrings.includes(w.word));
  if (retryWords.length === 0) return [];

  switch (config.category) {
    case 'grapheme':
      return generateGraphemePatternQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    case 'ipa-word':
      return generateIpaToWordQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    case 'word-ipa':
      return generateWordToIpaQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    case 'minimal-pairs':
      return generateMinimalPairsQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    case 'stress':
      return generateStressQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    case 'synonyms':
      return generateSynonymQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    case 'exercise':
      return generateExerciseQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    case 'vocab-exercise':
      return generateVocabExerciseQuestions(
        retryWords.length,
        config.level,
        retryWords.flatMap((w) => w.phonemes),
        words,
      );
    default:
      return [];
  }
}

export {
  selectWordByCefr,
  weightedRandomSelect,
  generatePhonicsQuestions,
  generateCardFlipCards,
  generateSpellingQuestions,
  generateDefinitionQuestions,
  buildQuestions,
  buildPlacementTest30,
  buildRetryQuestions,
  computeCorrectAnswer,
  generatePracticeQuestions,
  generateIpaToWordQuestions,
  generateWordToIpaQuestions,
  generateSynonymQuestions,
  generateGraphemePatternQuestions,
  generateMinimalPairsQuestions,
  generateStressQuestions,
  generateExerciseQuestions,
  buildActivityRetryQuestions,
  generatePhonemeMatchRound,
  generateSoundSortQuestions,
  generateRhymeTimeQuestions,
  generateSpeedSpellQuestions,
  generateSyllableSmashQuestions,
};
