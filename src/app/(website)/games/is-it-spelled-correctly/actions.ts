"use server";

import { promises as fs } from 'fs';
import path from 'path';
import type { VocabularyWord } from './types';

// In-memory cache variables for global Next.js process
let cachedThaiVocab: VocabularyWord[] | null = null;
let cachedEnglishVocab: VocabularyWord[] | null = null;

// The same parsing logic extracted from the original page
const readVocabFile = async (filename: string, hasDefinition: boolean = false): Promise<VocabularyWord[]> => {
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
         const parts = line.split(',');
         word = parts[0]?.trim();
         isCorrectStr = parts[1]?.trim();
         
         const firstCommaIdx = line.indexOf(',');
         const secondCommaIdx = line.indexOf(',', firstCommaIdx + 1);
         if (secondCommaIdx !== -1) {
           let defRaw = line.substring(secondCommaIdx + 1).trim();
           if (defRaw.startsWith('"') && defRaw.endsWith('"')) {
             defRaw = defRaw.substring(1, defRaw.length - 1); 
           }
           definition = defRaw && defRaw !== "" ? defRaw : undefined;
         } else {
           definition = undefined;
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

/**
 * Server Action to fetch a batch of randomized vocabulary.
 * Uses global in-memory caching to prevent massive disk I/O on high concurrency.
 */
export async function fetchVocabBatch(language: 'THAI' | 'ENGLISH', amount: number = 50): Promise<VocabularyWord[]> {
  let sourceVocab: VocabularyWord[] = [];

  if (language === 'THAI') {
    if (!cachedThaiVocab) {
      console.log('Cache miss: Reading Thai vocab from disk...');
      cachedThaiVocab = await readVocabFile('thai_word_spelling_game.csv', true);
    }
    sourceVocab = cachedThaiVocab;
  } else if (language === 'ENGLISH') {
    if (!cachedEnglishVocab) {
      console.log('Cache miss: Reading English vocab from disk...');
      cachedEnglishVocab = await readVocabFile('spelling_english_word.csv', false);
    }
    sourceVocab = cachedEnglishVocab;
  }

  // Safety fallback
  if (!sourceVocab || sourceVocab.length === 0) return [];

  // Create a randomized slice of the requested size
  // Shuffling the entire array via slice and sort can still be slightly slow for 6500 items,
  // but it's acceptable for memory. A better O(amount) approach is to randomly select indices.
  
  const selectedBatch: VocabularyWord[] = [];
  const maxIdx = sourceVocab.length;
  // Use a localized random picker to guarantee O(amount) performance instead of O(N log N) sorting
  for (let i = 0; i < amount && i < maxIdx; i++) {
    const randomIdx = Math.floor(Math.random() * maxIdx);
    selectedBatch.push(sourceVocab[randomIdx]);
  }

  return selectedBatch;
}
