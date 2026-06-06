import * as fs from 'fs';

interface JishoEntry {
  slug: string;
  japanese: { word?: string; reading: string }[];
  senses: { english_definitions: string[] }[];
}

interface DictEntry {
  word: string;
  reading: string;
  meanings: string[];
}

const PAGES = 50;
const DELAY_MS = 300;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(page: number): Promise<DictEntry[]> {
  const url = `https://jisho.org/api/v1/search/words?keyword=%23common&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on page ${page}`);
  }
  const json = await res.json();
  const data: JishoEntry[] = json.data || [];

  const entries: DictEntry[] = [];
  for (const item of data) {
    const firstJp = item.japanese[0];
    if (!firstJp) continue;
    const word = firstJp.word || firstJp.reading;
    const reading = firstJp.reading;
    const meanings = item.senses
      .flatMap((s) => s.english_definitions)
      .slice(0, 3);
    if (word && meanings.length > 0) {
      entries.push({ word, reading, meanings });
    }
  }
  return entries;
}

async function main() {
  const allEntries: DictEntry[] = [];
  const seen = new Set<string>();

  for (let i = 1; i <= PAGES; i++) {
    console.log(`Fetching page ${i}/${PAGES}...`);
    try {
      const pageEntries = await fetchPage(i);
      for (const entry of pageEntries) {
        if (!seen.has(entry.word)) {
          seen.add(entry.word);
          allEntries.push(entry);
        }
      }
    } catch (err) {
      console.error(`Failed on page ${i}:`, err);
      break;
    }
    if (i < PAGES) await sleep(DELAY_MS);
  }

  console.log(`Collected ${allEntries.length} unique entries.`);

  // Build TS module string
  let fileContent = `export interface CoreDictEntry {\n`;
  fileContent += `  word: string;\n`;
  fileContent += `  reading: string;\n`;
  fileContent += `  meanings: string[];\n`;
  fileContent += `}\n\n`;
  fileContent += `export const CORE1000_DICT: Record<string, CoreDictEntry> = {\n`;

  for (const entry of allEntries) {
    const key = entry.word;
    const reading = entry.reading;
    const meanings = entry.meanings.map((m) => `"${m.replace(/"/g, '\\"')}"`).join(', ');
    fileContent += `  "${key}": { word: "${key}", reading: "${reading}", meanings: [${meanings}] },\n`;
  }

  fileContent += `};\n`;

  fs.writeFileSync('src/lib/core1000Dict.ts', fileContent, 'utf-8');
  console.log('Wrote src/lib/core1000Dict.ts');
}

main();
