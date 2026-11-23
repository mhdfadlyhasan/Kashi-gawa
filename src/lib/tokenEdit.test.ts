import { describe, expect, it } from 'vitest';
import { Token } from '../types';
import { applyTokenReading, mergeAdjacentTokens, splitTokenAt } from './tokenEdit';

function token(overrides: Partial<Token> = {}): Token {
  return {
    word_id: 0,
    word_type: 'KNOWN',
    surface_form: '',
    pos: '名詞',
    pos_detail_1: '',
    pos_detail_2: '',
    pos_detail_3: '',
    conjugated_type: '',
    conjugated_form: '',
    basic_form: '',
    reading: '',
    pronunciation: '',
    ...overrides,
  };
}

describe('mergeAdjacentTokens', () => {
  it('uses the combined surface form as the lookup/dictionary form', () => {
    const left = token({
      surface_form: '二',
      basic_form: '二',
      reading: 'ニ',
      pronunciation: 'ニ',
    });
    const right = token({
      surface_form: '度',
      basic_form: '度',
      reading: 'ト',
      pronunciation: 'ト',
    });

    const merged = mergeAdjacentTokens(left, right);

    expect(merged.surface_form).toBe('二度');
    expect(merged.basic_form).toBe('二度');
    expect(merged.reading).toBe('ニト');
    expect(merged.pronunciation).toBe('ニト');
    expect(merged.conjugated_type).toBe('*');
    expect(merged.conjugated_form).toBe('*');
  });
});

describe('applyTokenReading', () => {
  it('replaces the target reading and pronunciation in place', () => {
    const other = token({ surface_form: '他', reading: 'タ', pronunciation: 'タ' });
    const merged = token({ surface_form: '一歩', basic_form: '一歩', reading: 'イチホ' });
    const lines = [[other, merged]];

    const updated = applyTokenReading(lines, 0, merged, 'イッポ');

    expect(updated[0][1].reading).toBe('イッポ');
    expect(updated[0][1].pronunciation).toBe('イッポ');
    expect(updated[0][0]).toBe(other);
  });

  it('leaves lines untouched when the target is not present', () => {
    const stray = token({ surface_form: '一歩' });
    const lines = [[token({ surface_form: '他' })]];

    const updated = applyTokenReading(lines, 0, stray, 'イッポ');

    expect(updated).toEqual(lines);
  });
});

describe('splitTokenAt', () => {
  it('sets each half basic form to its own surface', () => {
    const merged = token({
      surface_form: '二度',
      basic_form: '二度',
      reading: 'ニト',
    });

    const halves = splitTokenAt(merged, 1);

    expect(halves).not.toBeNull();
    const [left, right] = halves!;
    expect(left.surface_form).toBe('二');
    expect(left.basic_form).toBe('二');
    expect(right.surface_form).toBe('度');
    expect(right.basic_form).toBe('度');
  });

  it('returns null for out-of-range split points', () => {
    const merged = token({ surface_form: '二度', basic_form: '二度' });
    expect(splitTokenAt(merged, 0)).toBeNull();
    expect(splitTokenAt(merged, 2)).toBeNull();
  });
});
