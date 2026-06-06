import { CORE1000_DICT } from './core1000Dict';

export interface JishoResult {
  japanese: { word: string; reading: string }[];
  senses: { english_definitions: string[]; parts_of_speech: string[] }[];
}

interface CompactEntry {
  word: string;
  reading: string;
  meanings: string[];
}

let jmdictPromise: Promise<Record<string, CompactEntry>> | null = null;

function loadJmdict(): Promise<Record<string, CompactEntry>> {
  if (!jmdictPromise) {
    jmdictPromise = fetch(import.meta.env.BASE_URL + 'dict/jmdict-common.json')
      .then((res) => res.json())
      .catch(() => ({}));
  }
  return jmdictPromise;
}

export async function searchJisho(word: string): Promise<JishoResult | null> {
  // 1. Check JMDict common-only dictionary (~22k words, loaded from JSON)
  const jmdict = await loadJmdict();
  const jmEntry = jmdict[word];
  if (jmEntry) {
    return {
      japanese: [{ word: jmEntry.word, reading: jmEntry.reading }],
      senses: [
        {
          english_definitions: jmEntry.meanings,
          parts_of_speech: [],
        },
      ],
    };
  }

  // 2. Check local Core 1000 dictionary (offline, instant)
  const local = CORE1000_DICT[word];
  if (local) {
    return {
      japanese: [{ word: local.word, reading: local.reading }],
      senses: [
        {
          english_definitions: local.meanings,
          parts_of_speech: [],
        },
      ],
    };
  }

  // 3. Fall back to JLPT Vocab API (CORS-friendly)
  try {
    const res = await fetch(
      `https://jlpt-vocab-api.vercel.app/api/words?word=${encodeURIComponent(word)}`
    );
    const data = await res.json();
    if (!data.words || data.words.length === 0) return null;
    const first = data.words[0];
    return {
      japanese: [{ word: first.word, reading: first.furigana }],
      senses: [
        {
          english_definitions: first.meaning.split('; '),
          parts_of_speech: [],
        },
      ],
    };
  } catch {
    // continue to next fallback
  }

  // 4. Fall back to Wiktionary API (CORS-friendly)
  try {
    const res = await fetch(
      `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const jaEntries = data.ja;
    if (!jaEntries || jaEntries.length === 0) return null;

    const senses = jaEntries.map((entry: any) => ({
      english_definitions: entry.definitions
        .slice(0, 3)
        .map((d: any) =>
          typeof d.definition === 'string'
            ? d.definition.replace(/<[^>]+>/g, '')
            : ''
        )
        .filter(Boolean),
      parts_of_speech: [entry.partOfSpeech].filter(Boolean),
    }));

    if (senses.length === 0 || senses.every((s: any) => s.english_definitions.length === 0)) {
      return null;
    }

    return {
      japanese: [{ word, reading: '' }],
      senses,
    };
  } catch {
    return null;
  }
}
