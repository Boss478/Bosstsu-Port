import fs from 'fs';
import path from 'path';
import { extractStress } from './ipa-parser';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'words');

interface WordEntry {
  word: string;
  type: string;
  level: string;
  ipaUs: string;
  ipaUk: string;
  phonemes: string[];
  examples: string[];
  stress?: number[];
}

function enrichFile(level: string) {
  const filePath = path.join(DATA_DIR, `${level}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`  ${level}: file not found, skipping`);
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const words: WordEntry[] = JSON.parse(raw);

  let updated = 0;
  for (const word of words) {
    const ipa = word.ipaUs || word.ipaUk;
    if (ipa) {
      word.stress = extractStress(ipa);
      updated++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(words, null, 2), 'utf-8');
  console.log(`  ${level}: ${updated}/${words.length} stress patterns extracted`);
}

function main() {
  const levels = ['a1', 'a2', 'b1', 'b2', 'c1'];
  console.log('Extracting stress patterns...');
  for (const level of levels) {
    enrichFile(level);
  }
  console.log('Done.');
}

main();
