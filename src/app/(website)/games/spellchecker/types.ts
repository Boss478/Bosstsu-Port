export type VocabularyWord = {
  word: string;
  isCorrect: boolean;
  definition?: string;
  wordClass?: string;
  level?: string;
};

/**
 * Tracks per-word performance stats AND caches lightweight metadata
 * for the Result Screen. This enables "Data Decoupling" — we can safely
 * truncate the activeVocab array without losing history.
 */
export type WordStat = {
  appearances: number;
  correct: number;
  wrong: number;
  /** Cached from VocabularyWord.definition at first encounter */
  definition?: string;
  /** Cached from VocabularyWord.isCorrect at first encounter */
  isCorrectSpelling?: boolean;
};

export type VocabularyData = {
  thai: VocabularyWord[];
  english: VocabularyWord[];
};
