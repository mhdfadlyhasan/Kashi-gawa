export interface LrcLibTrack {
  id: number;
  name: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

export interface Token {
  word_id: number;
  word_type: string;
  surface_form: string;
  pos: string;
  pos_detail_1: string;
  pos_detail_2: string;
  pos_detail_3: string;
  conjugated_type: string;
  conjugated_form: string;
  basic_form: string;
  reading: string;
  pronunciation: string;
}

export interface LibraryItem {
  id: number;
  title: string;
  artist: string;
  plainLyrics: string;
  addedAt: string;
  tokens: Token[][] | null;
}

export interface WordBreakdown {
  surfaceForm: string;
  reading: string;
  dictionaryForm: string;
  grammarExplanation: string | null;
  meanings: string[];
}

export type GrammarType = 'noun' | 'particle' | 'verb' | 'other';
