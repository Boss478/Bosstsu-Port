import { promises as fs } from 'fs';
import path from 'path';
import FlashcardClient from './FlashcardClient';
import type { VocabularyWord } from './types';

export const metadata = {
  title: 'SpellCheck? | Boss478 Games',
  description: 'Test your spelling skills in Thai and English (US). / ฝึกทักษะการสะกดคำภาษาไทยและภาษาอังกฤษ',
};

export default async function FlashcardGamePage() {
  const getVocab = async (filename: string, hasDefinition: boolean = false): Promise<VocabularyWord[]> => {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'games', 'spelling', filename);
      const fileData = await fs.readFile(filePath, 'utf-8');
      
      const lines = fileData.split('\n');
      const vocab: VocabularyWord[] = [];
      
      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;
        
        let word, isCorrectStr, definition, wordClass, level;
        
        if (hasDefinition) {
           // Basic CSV parsing to handle quoted commas for definitions
           const parts = line.split(',');
           word = parts[0]?.trim();
           isCorrectStr = parts[1]?.trim();
           // Attempt to grab definition - this works for our simple format where rightmost is def
           const defMatch = line.match(/,"?([^"]*)"?$/);
           if (defMatch) {
              definition = defMatch[1].trim();
           }
        } else {
           const parts = line.split(',');
           word = parts[0];
           isCorrectStr = parts[1];
           wordClass = parts[2];
           level = parts[3];
        }
        
        if (word && isCorrectStr) {
          vocab.push({
            word: word.trim(),
            isCorrect: isCorrectStr.trim().toLowerCase() === 'true',
            definition: definition || undefined,
            wordClass: wordClass ? wordClass.trim() : undefined,
            level: level ? level.trim() : undefined,
          });
        }
      }
      return vocab;
    } catch (e) {
      console.error(`Error reading ${filename}:`, e);
      return [];
    }
  };

  const [thaiVocab, englishVocab] = await Promise.all([
    getVocab('thai_word_spelling_game.csv', true),
    getVocab('spelling_english_word.csv', false)
  ]);

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 pt-40 md:pt-48 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <FlashcardClient vocabData={{ thai: thaiVocab, english: englishVocab }} />
      </div>
    </div>
  );
}

