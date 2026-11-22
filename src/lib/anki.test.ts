import { describe, expect, it } from 'vitest';
import { escapeHtml, sentenceToHtml, toFurigana, tokensToSentenceHtml } from './anki';

describe('escapeHtml', () => {
  it('escapes HTML-sensitive characters', () => {
    expect(escapeHtml('<b> & "x"')).toBe('&lt;b&gt; &amp; &quot;x&quot;');
  });
});

describe('toFurigana', () => {
  it('annotates kanji and leaves okurigana plain', () => {
    expect(toFurigana('歌う', 'うたう')).toBe('<ruby>歌<rt>うた</rt></ruby>う');
    expect(toFurigana('走る', 'はしる')).toBe('<ruby>走<rt>はし</rt></ruby>る');
    expect(toFurigana('食べる', 'たべる')).toBe('<ruby>食<rt>た</rt></ruby>べる');
  });

  it('wraps a kanji-only word once', () => {
    expect(toFurigana('大人', 'おとな')).toBe('<ruby>大人<rt>おとな</rt></ruby>');
  });

  it('converts katakana readings to hiragana', () => {
    expect(toFurigana('空', 'ソラ')).toBe('<ruby>空<rt>そら</rt></ruby>');
  });

  it('falls back to plain text without a reading', () => {
    expect(toFurigana('歌う', '')).toBe('歌う');
    expect(toFurigana('歌う', '歌う')).toBe('歌う');
    expect(toFurigana('<b>', '')).toBe('&lt;b&gt;');
  });

  it('escapes the surface text', () => {
    expect(toFurigana('歌&', 'うた&')).toBe('<ruby>歌<rt>うた</rt></ruby>&amp;');
  });
});

describe('tokensToSentenceHtml', () => {
  it('adds furigana to every token and bolds the selected one', () => {
    expect(
      tokensToSentenceHtml(
        [
          { surface: '空', reading: 'ソラ' },
          { surface: 'の', reading: 'ノ' },
          { surface: '彼方', reading: 'カナタ' },
        ],
        0
      )
    ).toBe('<b><ruby>空<rt>そら</rt></ruby></b>の<ruby>彼方<rt>かなた</rt></ruby>');
  });
});

describe('sentenceToHtml', () => {
  it('bolds the first occurrence of the surface form', () => {
    expect(sentenceToHtml('空の彼方へ', '空')).toBe('<b>空</b>の彼方へ');
  });

  it('escapes the sentence and the surface form', () => {
    expect(sentenceToHtml('a & <b> x', '<b>')).toBe('a &amp; <b>&lt;b&gt;</b> x');
  });

  it('leaves the sentence unmodified when the surface is missing', () => {
    expect(sentenceToHtml('空の彼方へ', '海')).toBe('空の彼方へ');
  });

  it('appends the song name and singer below the sentence', () => {
    expect(sentenceToHtml('空の彼方へ', '空', 'Test Song', 'Test Singer')).toBe(
      '<b>空</b>の彼方へ<br><br>- Test Song + Test Singer'
    );
  });

  it('escapes the source line', () => {
    expect(sentenceToHtml('空', '空', '<Song>', 'A & B')).toBe(
      '<b>空</b><br><br>- &lt;Song&gt; + A &amp; B'
    );
  });
});
