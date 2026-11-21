import { describe, expect, it } from 'vitest';
import { Token } from '../types';
import { buildTimedLines, buildTimedTokens, findActive, getDurationMs } from './karaoke';

function token(surface_form: string, reading: string, pos = '名詞'): Token {
  return {
    word_id: 0,
    word_type: 'KNOWN',
    surface_form,
    pos,
    pos_detail_1: '',
    pos_detail_2: '',
    pos_detail_3: '',
    conjugated_type: '',
    conjugated_form: '',
    basic_form: surface_form,
    reading,
    pronunciation: reading,
  };
}

describe('buildTimedTokens', () => {
  it('distributes a line by reading length', () => {
    const timed = buildTimedTokens([
      { startMs: 0, endMs: 1000, tokens: [token('あ', 'ア'), token('を', 'ヲ', '助詞')] },
    ]);
    expect(timed).toHaveLength(2);
    expect(timed[0].startMs).toBe(0);
    expect(timed[0].endMs).toBe(500);
    expect(timed[1].startMs).toBe(500);
    expect(timed[1].endMs).toBe(1000);
  });

  it('skips punctuation tokens', () => {
    const timed = buildTimedTokens([
      { startMs: 0, endMs: 1000, tokens: [token('あ', 'ア'), token('、', '、', '記号')] },
    ]);
    expect(timed).toHaveLength(1);
    expect(timed[0]).toMatchObject({ tokenIdx: 0, startMs: 0, endMs: 800 });
  });

  it('clamps long instrumental gaps', () => {
    const timed = buildTimedTokens([{ startMs: 0, endMs: 20000, tokens: [token('あ', 'ア')] }]);
    expect(timed[0].endMs).toBeLessThanOrEqual(20000);
    expect(timed[0].endMs).toBe(800);
  });
});

describe('word-timed tokens', () => {
  it('uses enhanced LRC word timestamps when they match the tokens', () => {
    const timed = buildTimedTokens([
      {
        startMs: 10000,
        endMs: 14000,
        tokens: [token('こん', 'コン'), token('にちは', 'ニチハ')],
        words: [
          { timeMs: 10000, text: 'こん' },
          { timeMs: 11000, text: 'にちは' },
        ],
      },
    ]);
    expect(timed[0]).toMatchObject({ tokenIdx: 0, startMs: 10000, endMs: 11000 });
    expect(timed[1]).toMatchObject({ tokenIdx: 1, startMs: 11000, endMs: 13400 });
  });

  it('falls back to interpolation when word tags do not match the tokens', () => {
    const timed = buildTimedTokens([
      {
        startMs: 0,
        endMs: 1000,
        tokens: [token('あ', 'ア')],
        words: [{ timeMs: 0, text: 'い' }],
      },
    ]);
    expect(timed).toHaveLength(1);
    expect(timed[0]).toMatchObject({ startMs: 0, endMs: 800 });
  });
});

describe('findActive', () => {
  const timed = [
    { lineIdx: 0, tokenIdx: 0, startMs: 0, endMs: 400 },
    { lineIdx: 0, tokenIdx: 1, startMs: 400, endMs: 800 },
  ];

  it('returns the position before the first token', () => {
    expect(findActive(-1, timed)).toEqual({ lineIdx: 0, tokenIdx: -1, tokenProgress: 0 });
  });

  it('tracks progress within the current token', () => {
    expect(findActive(200, timed)).toEqual({ lineIdx: 0, tokenIdx: 0, tokenProgress: 0.5 });
  });

  it('moves to the next token at the boundary', () => {
    expect(findActive(400, timed)).toEqual({ lineIdx: 0, tokenIdx: 1, tokenProgress: 0 });
  });

  it('holds on the last token during a gap', () => {
    expect(findActive(5000, timed)).toEqual({ lineIdx: 0, tokenIdx: 1, tokenProgress: 1 });
  });

  it('returns null when there are no tokens', () => {
    expect(findActive(100, [])).toBeNull();
  });
});

describe('buildTimedLines', () => {
  it('aligns non-empty synced lines and keeps blank boundaries', () => {
    const synced = '[00:01.00] a\n[00:04.00] \n[00:08.00] b';
    const lines = buildTimedLines(synced, [[token('あ', 'ア')], [token('い', 'イ')]], 0);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ startMs: 1000, endMs: 4000 });
    expect(lines[1]).toMatchObject({ startMs: 8000, endMs: 13000 });
  });
});

describe('getDurationMs', () => {
  it('prefers the track duration', () => {
    expect(getDurationMs(120, [])).toBe(120000);
  });

  it('falls back to the last timed token', () => {
    expect(getDurationMs(undefined, [{ lineIdx: 0, tokenIdx: 0, startMs: 0, endMs: 9500 }])).toBe(
      9500
    );
  });

  it('returns zero with no data', () => {
    expect(getDurationMs(undefined, [])).toBe(0);
  });
});
