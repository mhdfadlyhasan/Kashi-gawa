import { showToast } from '../lib/toast';
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

interface JmdictIndex {
  byWord: Record<string, CompactEntry>;
  byReading: Record<string, CompactEntry>;
}

let jmdictPromise: Promise<JmdictIndex> | null = null;

function loadJmdict(): Promise<JmdictIndex> {
  if (!jmdictPromise) {
    jmdictPromise = fetch(import.meta.env.BASE_URL + 'dict/jmdict-common.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Dictionary fetch failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data: Record<string, CompactEntry>) => {
        const byReading: Record<string, CompactEntry> = {};
        for (const entry of Object.values(data)) {
          if (entry.reading && entry.reading !== entry.word) {
            byReading[entry.reading] = entry;
          }
        }
        return { byWord: data, byReading };
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        showToast(`Dictionary load failed — ${message}`);
        return { byWord: {}, byReading: {} };
      });
  }
  return jmdictPromise;
}

// Maps godan e-column endings back to u-column for potential forms
const GODAN_E_TO_U: Record<string, string> = {
  'け': 'く', 'げ': 'ぐ', 'せ': 'す', 'て': 'つ', 'ね': 'ぬ',
  'へ': 'ふ', 'め': 'む', 'れ': 'る', 'べ': 'ぶ', 'え': 'う',
};

// Maps godan a-column endings back to u-column for passive/causative forms
const GODAN_A_TO_U: Record<string, string> = {
  'か': 'く', 'が': 'ぐ', 'さ': 'す', 'た': 'つ', 'な': 'ぬ',
  'は': 'ふ', 'ま': 'む', 'ら': 'る', 'ば': 'ぶ', 'わ': 'う',
};

function* deconjugate(word: string): Generator<string> {
  // Special verbs
  if (word === 'できる' || word === '出来る') {
    yield 'する';
  }
  if (word === 'こられる' || word === 'こさせる' || word === '来られる') {
    yield 'くる';
  }
  if (word === 'される') {
    yield 'する';
  }

  // Ichidan potential / passive
  if (word.endsWith('られる')) {
    yield word.slice(0, -3) + 'る';
  }
  // Ichidan causative
  if (word.endsWith('させる')) {
    yield word.slice(0, -3) + 'る';
  }
  // Godan potential (e-form + る)
  if (word.endsWith('る')) {
    const stem = word.slice(0, -1);
    const last = stem[stem.length - 1];
    if (last && GODAN_E_TO_U[last]) {
      yield stem.slice(0, -1) + GODAN_E_TO_U[last];
    }
  }
  // Godan passive / causative (a-form + れる / せる)
  if (word.endsWith('れる') || word.endsWith('せる')) {
    const stem = word.slice(0, -2);
    const last = stem[stem.length - 1];
    if (last && GODAN_A_TO_U[last]) {
      yield stem.slice(0, -1) + GODAN_A_TO_U[last];
    }
  }
}

async function searchLocal(word: string): Promise<JishoResult | null> {
  const jmdict = await loadJmdict();
  const jmEntry = jmdict.byWord[word] || jmdict.byReading[word];
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
  return null;
}

export async function searchJisho(word: string): Promise<JishoResult | null> {
  // 1. Direct local lookup
  const direct = await searchLocal(word);
  if (direct) return direct;

  // 2. Deconjugated local lookup (e.g., potential → dictionary form)
  for (const form of deconjugate(word)) {
    const de = await searchLocal(form);
    if (de) return de;
  }

  // 3. Fall back to JLPT Vocab API (CORS-friendly)
  try {
    const res = await fetch(
      `https://jlpt-vocab-api.vercel.app/api/words?word=${encodeURIComponent(word)}`
    );
    if (!res.ok) {
      throw new Error(`JLPT API failed: ${res.status}`);
    }
    const data = await res.json();
    if (!data.words || data.words.length === 0) {
      // Try deconjugated forms against API as well
      for (const form of deconjugate(word)) {
        const deRes = await fetch(
          `https://jlpt-vocab-api.vercel.app/api/words?word=${encodeURIComponent(form)}`
        );
        if (!deRes.ok) continue;
        const deData = await deRes.json();
        if (deData.words && deData.words.length > 0) {
          const first = deData.words[0];
          return {
            japanese: [{ word: first.word, reading: first.furigana }],
            senses: [
              {
                english_definitions: first.meaning.split('; '),
                parts_of_speech: [],
              },
            ],
          };
        }
      }
      return null;
    }
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    showToast(`Dictionary lookup failed — ${message}`);
    // continue to next fallback
  }

  // 4. Fall back to Wiktionary API (CORS-friendly)
  try {
    const res = await fetch(
      `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`
    );
    if (!res.ok) {
      throw new Error(`Wiktionary failed: ${res.status}`);
    }
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    showToast(`Wiktionary fallback failed — ${message}`);
    return null;
  }
}
