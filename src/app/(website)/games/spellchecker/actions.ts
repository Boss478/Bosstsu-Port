"use server";

import { promises as fs } from 'fs';
import path from 'path';
import type { VocabularyWord } from './types';
import { z } from 'zod';

// In-memory cache variables for global Next.js process
let cachedThaiVocab: VocabularyWord[] | null = null;
let cachedEnglishVocab: VocabularyWord[] | null = null;

// Helper to sanitize raw CSV strings (Issue #14)
const sanitize = (str: string): string => str.replace(/<[^>]*>/g, '').trim();

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
      
      // Split by comma, but ignore commas inside double quotes
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      
      let word, isCorrectStr, definition, wordClass, level;
      
      if (hasDefinition) {
         word = parts[0];
         isCorrectStr = parts[1];
         let defRaw = parts[2] || "";
         
         // Remove surrounding quotes if they exist
         if (defRaw.startsWith('"') && defRaw.endsWith('"')) {
           defRaw = defRaw.substring(1, defRaw.length - 1);
         }
         definition = defRaw && defRaw.trim() !== "" ? defRaw : undefined;
      } else {
         word = parts[0];
         isCorrectStr = parts[1];
         wordClass = parts[2];
         level = parts[3];
      }
      
      if (word && isCorrectStr) {
        vocab.push({
          word: sanitize(word),
          isCorrect: isCorrectStr.trim().toLowerCase() === 'true',
          definition: definition ? sanitize(definition) : undefined,
          wordClass: wordClass ? sanitize(wordClass) : undefined,
          level: level ? sanitize(level) : undefined,
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
const fetchVocabSchema = z.object({
  language: z.enum(['THAI', 'ENGLISH']),
  amount: z.number().int().min(1).max(200).default(50)
});

export async function fetchVocabBatch(rawLanguage: 'THAI' | 'ENGLISH', rawAmount: number = 50): Promise<VocabularyWord[]> {
  try {
    const { language, amount } = fetchVocabSchema.parse({ language: rawLanguage, amount: rawAmount });
    
    let sourceVocab: VocabularyWord[] = [];

    if (language === 'THAI') {
    if (!cachedThaiVocab) {
      cachedThaiVocab = await readVocabFile('thai_word_spelling_game.csv', true);
    }
    sourceVocab = cachedThaiVocab;
  } else if (language === 'ENGLISH') {
    if (!cachedEnglishVocab) {
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
  const pickedCount = Math.min(amount, maxIdx);
  
  // Use Fisher-Yates partial shuffle to guarantee unique indices in O(amount)
  const indices = Array.from({ length: maxIdx }, (_, i) => i);
  for (let i = 0; i < pickedCount; i++) {
    const randomOffset = Math.floor(Math.random() * (maxIdx - i));
    const swapIdx = i + randomOffset;
    
    // Swap chosen index to the front of the available pool
    [indices[i], indices[swapIdx]] = [indices[swapIdx], indices[i]];
    
    selectedBatch.push(sourceVocab[indices[i]]);
  }

  return selectedBatch;
  } catch (error) {
    console.error("fetchVocabBatch Error:", error);
    return [];
  }
}
