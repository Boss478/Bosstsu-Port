export type VocabularyWord = {
  word: string;
  isCorrect: boolean;
  definition?: string;
  wordClass?: string;
  level?: string;
};

export type VocabularyData = {
  thai: VocabularyWord[];
  english: VocabularyWord[];
};
