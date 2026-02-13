#!/usr/bin/env node
/**
 * Fetches all 66 KJV books from aruljohn/Bible-kjv (GitHub) and merges into data/kjv_bible.json.
 * Usage: node scripts/fetch_kjv_bible.js
 * Requires: network access.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Display names (for output) and repo file names (no spaces: 1Samuel.json, SongofSolomon.json, etc.)
const BOOKS = [
  ['Genesis', 'Genesis'], ['Exodus', 'Exodus'], ['Leviticus', 'Leviticus'], ['Numbers', 'Numbers'],
  ['Deuteronomy', 'Deuteronomy'], ['Joshua', 'Joshua'], ['Judges', 'Judges'], ['Ruth', 'Ruth'],
  ['1 Samuel', '1Samuel'], ['2 Samuel', '2Samuel'], ['1 Kings', '1Kings'], ['2 Kings', '2Kings'],
  ['1 Chronicles', '1Chronicles'], ['2 Chronicles', '2Chronicles'], ['Ezra', 'Ezra'], ['Nehemiah', 'Nehemiah'],
  ['Esther', 'Esther'], ['Job', 'Job'], ['Psalms', 'Psalms'], ['Proverbs', 'Proverbs'],
  ['Ecclesiastes', 'Ecclesiastes'], ['Song of Solomon', 'SongofSolomon'], ['Isaiah', 'Isaiah'], ['Jeremiah', 'Jeremiah'],
  ['Lamentations', 'Lamentations'], ['Ezekiel', 'Ezekiel'], ['Daniel', 'Daniel'], ['Hosea', 'Hosea'], ['Joel', 'Joel'],
  ['Amos', 'Amos'], ['Obadiah', 'Obadiah'], ['Jonah', 'Jonah'], ['Micah', 'Micah'], ['Nahum', 'Nahum'],
  ['Habakkuk', 'Habakkuk'], ['Zephaniah', 'Zephaniah'], ['Haggai', 'Haggai'], ['Zechariah', 'Zechariah'], ['Malachi', 'Malachi'],
  ['Matthew', 'Matthew'], ['Mark', 'Mark'], ['Luke', 'Luke'], ['John', 'John'], ['Acts', 'Acts'],
  ['Romans', 'Romans'], ['1 Corinthians', '1Corinthians'], ['2 Corinthians', '2Corinthians'], ['Galatians', 'Galatians'],
  ['Ephesians', 'Ephesians'], ['Philippians', 'Philippians'], ['Colossians', 'Colossians'],
  ['1 Thessalonians', '1Thessalonians'], ['2 Thessalonians', '2Thessalonians'], ['1 Timothy', '1Timothy'], ['2 Timothy', '2Timothy'],
  ['Titus', 'Titus'], ['Philemon', 'Philemon'], ['Hebrews', 'Hebrews'], ['James', 'James'],
  ['1 Peter', '1Peter'], ['2 Peter', '2Peter'], ['1 John', '1John'], ['2 John', '2John'], ['3 John', '3John'],
  ['Jude', 'Jude'], ['Revelation', 'Revelation']
];

const BASE = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master';

async function fetchBook(displayName, fileName) {
  const file = (fileName || displayName).replace(/\s/g, '') + '.json';
  const url = `${BASE}/${file}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${displayName}: ${res.status}`);
  const data = await res.json();
  if (data.book !== displayName) data.book = displayName;
  return data;
}

async function main() {
  const outPath = path.join(__dirname, '..', 'data', 'kjv_bible.json');
  const dataDir = path.dirname(outPath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const bible = { translation: 'KJV', books: [] };
  for (let i = 0; i < BOOKS.length; i++) {
    const [displayName, fileBase] = BOOKS[i];
    process.stderr.write(`Fetching ${i + 1}/${BOOKS.length} ${displayName}...\n`);
    try {
      const book = await fetchBook(displayName, fileBase);
      bible.books.push(book);
    } catch (e) {
      console.error(`Failed to fetch ${displayName}:`, e.message);
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(bible, null, 0), 'utf8');
  console.log('Written:', outPath);
}

main().catch((e) => { console.error(e); process.exit(1); });
