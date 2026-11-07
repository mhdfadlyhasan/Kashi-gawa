import { describe, expect, it } from 'vitest';
import { katakanaToHiragana, kanaToRomaji, convertReading } from './kana';

describe('katakanaToHiragana', () => {
  it('converts katakana to hiragana', () => {
    expect(katakanaToHiragana('カタカナ')).toBe('かたかな');
  });

  it('leaves hiragana unchanged', () => {
    expect(katakanaToHiragana('ひらがな')).toBe('ひらがな');
  });

  it('leaves non-kana characters unchanged', () => {
    expect(katakanaToHiragana('テストABC')).toBe('てすとABC');
  });
});

describe('kanaToRomaji', () => {
  it('converts basic hiragana', () => {
    expect(kanaToRomaji('さくら')).toBe('sakura');
  });

  it('converts katakana', () => {
    expect(kanaToRomaji('カタカナ')).toBe('katakana');
  });

  it('handles compound kana (youon)', () => {
    expect(kanaToRomaji('きょう')).toBe('kyou');
    expect(kanaToRomaji('しゃしん')).toBe('shashin');
  });

  it('handles sokuon (small tsu) by doubling the next consonant', () => {
    expect(kanaToRomaji('きって')).toBe('kitte');
    expect(kanaToRomaji('がっこう')).toBe('gakkou');
  });

  it('handles the long vowel mark', () => {
    expect(kanaToRomaji('コーヒー')).toBe('koohii');
  });

  it('passes through characters it cannot map', () => {
    expect(kanaToRomaji('こんにちは')).toBe('konnichiha');
  });
});

describe('convertReading', () => {
  it('returns an empty string for empty input', () => {
    expect(convertReading('', 'romaji')).toBe('');
  });

  it('converts to hiragana', () => {
    expect(convertReading('テスト', 'hiragana')).toBe('てすと');
  });

  it('returns katakana mode input unchanged', () => {
    expect(convertReading('テスト', 'katakana')).toBe('テスト');
  });

  it('converts to romaji', () => {
    expect(convertReading('カタカナ', 'romaji')).toBe('katakana');
  });
});
