import { LrcEntry, LrcLine, LrcWord } from '../types';

const OFFSET_TAG = /\[offset:\s*([+-]?\d+)\s*\]/i;
const WORD_TAG_SOURCE = '<(\\d{1,3}):(\\d{2})(?:[.:](\\d{1,3}))?>';

function fractionToMs(fraction: string | undefined): number {
  if (!fraction) return 0;
  const digits = fraction.slice(0, 3);
  const value = parseInt(digits, 10);
  if (Number.isNaN(value)) return 0;
  if (digits.length === 1) return value * 100;
  if (digits.length === 2) return value * 10;
  return value;
}

function tagToMs(minutes: string, seconds: string, fraction: string | undefined): number {
  return parseInt(minutes, 10) * 60000 + parseInt(seconds, 10) * 1000 + fractionToMs(fraction);
}

function parseWordTags(rawText: string, offsetMs: number): LrcWord[] | undefined {
  const tagPattern = new RegExp(WORD_TAG_SOURCE, 'g');
  const matches = Array.from(rawText.matchAll(tagPattern));
  if (matches.length === 0) return undefined;

  const words: LrcWord[] = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const start = (match.index ?? 0) + match[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? rawText.length) : rawText.length;
    const text = rawText.slice(start, end).trim();
    if (!text) continue;
    words.push({
      timeMs: Math.max(0, tagToMs(match[1], match[2], match[3]) + offsetMs),
      text,
    });
  }

  return words.length > 0 ? words : undefined;
}

/**
 * Parse standard LRC text into timed lines.
 * Handles `[mm:ss.xx]`, `[mm:ss:xx]`, multiple timestamp tags per line,
 * `[offset:±ms]`, and ignores metadata tags such as `[ti:]` / `[ar:]`.
 */
export function parseLrc(raw: string): LrcLine[] {
  if (!raw) return [];

  const offsetMatch = raw.match(OFFSET_TAG);
  const offsetMs = offsetMatch ? parseInt(offsetMatch[1], 10) : 0;
  const timeTag = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

  const lines: LrcLine[] = [];

  for (const rawLine of raw.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    timeTag.lastIndex = 0;
    const times: number[] = [];
    let textStart = 0;
    let match: RegExpExecArray | null;

    while ((match = timeTag.exec(trimmed)) !== null) {
      const gap = trimmed.slice(textStart, match.index);
      if (gap.trim() !== '') break;

      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const timeMs = minutes * 60000 + seconds * 1000 + fractionToMs(match[3]);
      times.push(Math.max(0, timeMs + offsetMs));
      textStart = timeTag.lastIndex;
    }

    if (times.length === 0) continue;

    const rawText = trimmed.slice(textStart);
    const words = parseWordTags(rawText, offsetMs);
    const text = rawText.replace(new RegExp(WORD_TAG_SOURCE, 'g'), '').trim();
    for (const timeMs of times) {
      lines.push({ timeMs, text, words });
    }
  }

  lines.sort((a, b) => a.timeMs - b.timeMs);
  return lines;
}

export function lrcHasWordTiming(raw: string): boolean {
  return parseLrc(raw).some((line) => Boolean(line.words && line.words.length > 0));
}

/**
 * Attach start/end times to each line. Blank timed lines are kept as
 * boundaries so the preceding line ends where the gap begins.
 */
export function toTimedEntries(lines: LrcLine[], fallbackEndMs?: number): LrcEntry[] {
  return lines.map((line, i) => {
    const next = lines[i + 1];
    const end = next ? next.timeMs : (fallbackEndMs ?? line.timeMs + 5000);
    return {
      startMs: line.timeMs,
      endMs: Math.max(line.timeMs, end),
      text: line.text,
      words: line.words,
    };
  });
}
