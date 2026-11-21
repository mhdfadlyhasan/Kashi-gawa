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
  titleReading?: string;
  artistReading?: string;
  syncedLyrics?: string | null;
  duration?: number;
  tokensSource?: 'plain' | 'synced';
  youtubeId?: string;
  youtubeOffsetMs?: number;
}

export interface LrcWord {
  timeMs: number;
  text: string;
}

export interface LrcLine {
  timeMs: number;
  text: string;
  words?: LrcWord[];
}

export interface LrcEntry {
  startMs: number;
  endMs: number;
  text: string;
  words?: LrcWord[];
}

export interface TimedLine {
  startMs: number;
  endMs: number;
  tokens: Token[];
  words?: LrcWord[];
}

export interface TimedToken {
  lineIdx: number;
  tokenIdx: number;
  startMs: number;
  endMs: number;
}

export interface KaraokePosition {
  lineIdx: number;
  tokenIdx: number;
  tokenProgress: number;
}

export type KaraokeTokenState = 'past' | 'active' | 'upcoming';

export interface WordBreakdown {
  surfaceForm: string;
  reading: string;
  dictionaryForm: string;
  grammarExplanation: string | null;
  meanings: string[];
}

export type GrammarType =
  'noun' | 'particle' | 'verb' | 'adjective' | 'adverb' | 'interjection' | 'adnominal' | 'other';
