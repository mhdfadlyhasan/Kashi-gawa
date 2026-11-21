import { describe, expect, it } from 'vitest';
import { lrcHasWordTiming, parseLrc, toTimedEntries } from './lrc';

describe('parseLrc', () => {
  it('parses basic timestamps', () => {
    const lines = parseLrc('[00:10.87] first\n[00:13.55] second');
    expect(lines).toEqual([
      { timeMs: 10870, text: 'first' },
      { timeMs: 13550, text: 'second' },
    ]);
  });

  it('handles millisecond and single-digit fractions', () => {
    const lines = parseLrc('[01:02.345] a\n[01:03.5] b');
    expect(lines[0].timeMs).toBe(62345);
    expect(lines[1].timeMs).toBe(63500);
  });

  it('expands multiple timestamps on one line', () => {
    const lines = parseLrc('[00:01.00][00:05.00] chorus');
    expect(lines).toEqual([
      { timeMs: 1000, text: 'chorus' },
      { timeMs: 5000, text: 'chorus' },
    ]);
  });

  it('applies the offset tag', () => {
    const lines = parseLrc('[offset:+500]\n[00:01.00] shifted');
    expect(lines[0].timeMs).toBe(1500);
  });

  it('ignores metadata tags', () => {
    const lines = parseLrc('[ti:Title]\n[ar:Artist]\n[00:01.00] lyric');
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe('lyric');
  });

  it('sorts lines by time', () => {
    const lines = parseLrc('[00:05.00] later\n[00:01.00] earlier');
    expect(lines.map((l) => l.text)).toEqual(['earlier', 'later']);
  });

  it('keeps blank timed lines for boundaries', () => {
    const lines = parseLrc('[00:01.00] a\n[00:04.00] \n[00:08.00] b');
    expect(lines).toHaveLength(3);
    expect(lines[1].text).toBe('');
  });
});

describe('enhanced LRC word timing', () => {
  it('parses inline word tags and strips them from the line text', () => {
    const lines = parseLrc('[00:10.00]<00:10.00>こん<00:11.00>にちは');
    expect(lines[0].text).toBe('こんにちは');
    expect(lines[0].words).toEqual([
      { timeMs: 10000, text: 'こん' },
      { timeMs: 11000, text: 'にちは' },
    ]);
  });

  it('applies the offset to word tags', () => {
    const lines = parseLrc('[offset:+500]\n[00:10.00]<00:10.00>あ');
    expect(lines[0].words?.[0].timeMs).toBe(10500);
  });

  it('reports whether word timing is present', () => {
    expect(lrcHasWordTiming('[00:10.00] plain')).toBe(false);
    expect(lrcHasWordTiming('[00:10.00]<00:10.00>あ')).toBe(true);
  });
});

describe('toTimedEntries', () => {
  it('uses the next timestamp as the end boundary', () => {
    const entries = toTimedEntries(parseLrc('[00:01.00] a\n[00:04.00] b'));
    expect(entries[0]).toEqual({ startMs: 1000, endMs: 4000, text: 'a' });
    expect(entries[1]).toEqual({ startMs: 4000, endMs: 9000, text: 'b' });
  });

  it('uses the fallback end for the last line', () => {
    const entries = toTimedEntries(parseLrc('[00:01.00] a'), 12000);
    expect(entries[0].endMs).toBe(12000);
  });
});
