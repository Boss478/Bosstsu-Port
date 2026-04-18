/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const inputFile = path.join(__dirname, '../src/data/games/spelling/thai_word.csv');
const outputFile = path.join(__dirname, '../src/data/games/spelling/thai_word_with_def.csv');

// Ignore SSL certificate issues due to misconfigured servers if any
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function fetchDefinition(word) {
  try {
    const response = await axios.post(
      'https://dictionary.orst.go.th/func_lookup.php',
      `word=${encodeURIComponent(word)}&funcName=lookupWord&status=lookup`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        httpsAgent,
      }
    );

    const html = response.data;
    if (!html || html.trim() === '') {
      return 'ไม่พบความหมาย';
    }

    const $ = cheerio.load(html);
    
    // The definition is inside the innermost .panel-body
    const definitionHtml = $('.panel-body .panel-body').html();
    if (!definitionHtml) return 'ไม่พบความหมาย';

    // Replace `<br>` with spaces, remove tags and clean up whitespace
    let definitionText = definitionHtml
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/&nbsp;/gi, ' ');
    
    const $clean = cheerio.load(definitionText);
    const textContext = $clean.text().replace(/\s+/g, ' ').trim();
    return textContext;
  } catch (error) {
    console.error(`Error fetching definition for ${word}:`, error.message);
    return 'เกิดข้อผิดพลาดในการดึงข้อมูล';
  }
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('Reading input file...');
  const fileContent = fs.readFileSync(inputFile, 'utf-8');
  const records = parse(fileContent, { columns: true, skip_empty_lines: true });

  // ONLY extract valid words
  const validWords = records
    .filter(record => record['ถูกต้อง'] === 'true')
    .map(record => record['คำ']);

  console.log(`Found ${validWords.length} valid words to fetch.`);

  const results = [];
  
  for (let i = 0; i < validWords.length; i++) {
    const word = validWords[i];
    console.log(`[${i + 1}/${validWords.length}] Fetching definition for: ${word}`);
    
    const definition = await fetchDefinition(word);
    
    results.push({
      'คำ': word,
      'ความหมาย': definition
    });
    
    // Add a small delay to avoid hitting the server too hard
    await delay(300);
  }

  console.log('Writing to output file...');
  const outputContent = stringify(results, { header: true });
  fs.writeFileSync(outputFile, outputContent, 'utf-8');
  
  console.log('Done! Saved to:', outputFile);
}

run().catch(console.error);
