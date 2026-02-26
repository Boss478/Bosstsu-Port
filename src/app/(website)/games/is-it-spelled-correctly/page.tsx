import { promises as fs } from 'fs';
import path from 'path';
import FlashcardClient from './FlashcardClient';

export const metadata = {
  title: 'Is it spelled correctly? | Boss478 Games',
  description: 'Test your spelling skills in Thai and English (US). / ฝึกทักษะการสะกดคำภาษาไทยและภาษาอังกฤษ',
};

export type VocabularyWord = {
  word: string;
  isCorrect: boolean;
};

export type VocabularyData = {
  thai: VocabularyWord[];
  english: VocabularyWord[];
};

export default async function FlashcardGamePage() {
  const getVocab = async (filename: string): Promise<VocabularyWord[]> => {
    try {
      const filePath = path.join(process.cwd(), 'public', 'files', filename);
      const fileData = await fs.readFile(filePath, 'utf-8');
      
      const lines = fileData.split('\n');
      const vocab: VocabularyWord[] = [];
      
      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;
        
        const [word, isCorrectStr] = line.split(',');
        if (word && isCorrectStr) {
          vocab.push({
            word: word.trim(),
            isCorrect: isCorrectStr.trim().toLowerCase() === 'true',
          });
        }
      }
      return vocab;
    } catch (e) {
      console.error(`Error reading ${filename}:`, e);
      return [];
    }
  };

  const thaiVocab = await getVocab('word.csv');
  const englishVocab = await getVocab('english_word.csv');

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 pt-40 md:pt-48 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <FlashcardClient vocabData={{ thai: thaiVocab, english: englishVocab }} />
      </div>
    </div>
  );
}
