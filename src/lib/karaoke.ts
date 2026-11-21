import { KaraokePosition, TimedLine, TimedToken, Token } from '../types';
import { parseLrc, toTimedEntries } from './lrc';

const PUNCTUATION = /^[\s\p{P}\p{S}]+$/u;
const TARGET_MS_PER_WEIGHT = 800;
const MIN_LINE_MS = 800;

function isPunctuation(token: Token): boolean {
  return token.pos === '記号' || PUNCTUATION.test(token.surface_form);
}

function tokenWeight(token: Token): number {
  if (isPunctuation(token)) return 0;
  const reading = token.reading && token.reading !== '*' ? token.reading : token.surface_form;
  return Math.max(1, reading.length);
}

function charsOf(text: string): string[] {
  return Array.from(text).filter((ch) => !/\s/.test(ch));
}

/**
 * Use enhanced LRC word tags (`<mm:ss.xx>`) when they align with the tokens.
 * Character times are interpolated within each tagged word so finer-grained
 * tokenization still progresses smoothly. Returns null when word tags are
 * missing or do not match the tokenized line, in which case the caller falls
 * back to line-level interpolation.
 */
function buildWordTimedTokens(line: TimedLine, lineIdx: number): TimedToken[] | null {
  const words = line.words;
  if (!words || words.length === 0) return null;

  const tokenStr = line.tokens.map((token) => charsOf(token.surface_form).join('')).join('');
  if (!tokenStr) return null;

  const flat: { ch: string; startMs: number; endMs: number }[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const chars = charsOf(word.text);
    if (chars.length === 0) continue;

    const nextStart = words[i + 1]?.timeMs ?? line.endMs;
    const cap = Math.max(MIN_LINE_MS, chars.length * TARGET_MS_PER_WEIGHT);
    const segEnd = Math.min(Math.max(word.timeMs, nextStart), word.timeMs + cap);
    const perChar = Math.max(0, segEnd - word.timeMs) / chars.length;

    for (let ci = 0; ci < chars.length; ci++) {
      const startMs = word.timeMs + perChar * ci;
      flat.push({ ch: chars[ci], startMs, endMs: startMs + perChar });
    }
  }

  if (flat.map((c) => c.ch).join('') !== tokenStr) return null;

  const timed: TimedToken[] = [];
  let cursor = 0;
  for (let tokenIdx = 0; tokenIdx < line.tokens.length; tokenIdx++) {
    const length = charsOf(line.tokens[tokenIdx].surface_form).length;
    if (length === 0) continue;

    const first = flat[cursor];
    const last = flat[Math.min(cursor + length - 1, flat.length - 1)];
    const startMs = first?.startMs ?? line.startMs;
    const endMs = Math.max(startMs, last?.endMs ?? line.endMs);
    timed.push({ lineIdx, tokenIdx, startMs, endMs });
    cursor += length;
  }

  return timed;
}

/**
 * Distribute each line's duration across its tokens, weighted by reading length
 * (a proxy for morae). Long instrumental gaps are clamped so the last word is
 * not stretched over the whole gap.
 */
export function buildTimedTokens(lines: TimedLine[]): TimedToken[] {
  const timed: TimedToken[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const tokens = line.tokens;
    if (tokens.length === 0) continue;

    const wordTimed = buildWordTimedTokens(line, lineIdx);
    if (wordTimed) {
      timed.push(...wordTimed);
      continue;
    }

    const weights = tokens.map(tokenWeight);
    const total = weights.reduce((sum, w) => sum + w, 0);
    const effective = total > 0 ? weights : tokens.map(() => 1);
    const totalEffective = effective.reduce((sum, w) => sum + w, 0);

    const window = Math.max(0, line.endMs - line.startMs);
    const ideal = Math.max(MIN_LINE_MS, totalEffective * TARGET_MS_PER_WEIGHT);
    const singingMs = window > 0 ? Math.min(window, ideal) : ideal;
    const unit = singingMs / totalEffective;

    let cursor = line.startMs;
    for (let tokenIdx = 0; tokenIdx < tokens.length; tokenIdx++) {
      const weight = effective[tokenIdx];
      if (weight === 0) continue;
      const startMs = cursor;
      const endMs = startMs + weight * unit;
      timed.push({ lineIdx, tokenIdx, startMs, endMs });
      cursor = endMs;
    }
  }

  return timed;
}

/**
 * Find the token currently being sung at `timeMs`.
 * Before the first token, `tokenIdx` is -1 so every token is "upcoming".
 * During gaps the last started token stays active (progress 1).
 */
export function findActive(timeMs: number, timed: TimedToken[]): KaraokePosition | null {
  if (timed.length === 0) return null;

  if (timeMs < timed[0].startMs) {
    return { lineIdx: timed[0].lineIdx, tokenIdx: -1, tokenProgress: 0 };
  }

  let lo = 0;
  let hi = timed.length - 1;
  let index = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (timed[mid].startMs <= timeMs) {
      index = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  const current = timed[index];
  const span = current.endMs - current.startMs;
  const tokenProgress = span > 0 ? Math.min(1, Math.max(0, (timeMs - current.startMs) / span)) : 1;

  return { lineIdx: current.lineIdx, tokenIdx: current.tokenIdx, tokenProgress };
}

/**
 * Pair non-empty synced lines with their tokenized forms.
 * Token order must match the order of non-empty synced lines.
 */
export function buildTimedLines(
  syncedLyrics: string,
  tokens: Token[][],
  durationMs: number
): TimedLine[] {
  const lrcLines = parseLrc(syncedLyrics);
  if (lrcLines.length === 0) return [];

  const lastTime = lrcLines[lrcLines.length - 1].timeMs;
  const fallbackEnd = durationMs > lastTime ? durationMs : lastTime + 5000;
  const entries = toTimedEntries(lrcLines, fallbackEnd).filter((entry) => entry.text.trim() !== '');

  return entries.map((entry, i) => ({
    startMs: entry.startMs,
    endMs: entry.endMs,
    tokens: tokens[i] ?? [],
    words: entry.words,
  }));
}

export function getDurationMs(durationSeconds: number | undefined, timed: TimedToken[]): number {
  const durationMs = durationSeconds && durationSeconds > 0 ? durationSeconds * 1000 : 0;
  const lastEndMs = timed.length > 0 ? timed[timed.length - 1].endMs : 0;
  return Math.max(durationMs, lastEndMs);
}
