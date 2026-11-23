import { describe, expect, it } from 'vitest';
import { AnkiCard } from '../types';
import {
  buildCsv,
  buildImageField,
  csvFileName,
  escapeHtml,
  findHighlightIndex,
  isCustomSentence,
  sentenceToHtml,
  toFurigana,
  tokensToSentenceHtml,
} from './anki';

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

describe('isCustomSentence', () => {
  const base: AnkiCard = {
    id: 'custom-1',
    term: '走る',
    reading: 'はしる',
    surface: '走った',
    meaning: 'to run',
    sentence: '走った',
    sourceSentence: '走った',
    sentenceMeaning: '',
    notes: '',
    sourceTitle: 'Song',
    sourceArtist: 'Artist',
    addedAt: '2026-01-01T00:00:00.000Z',
  };

  it('is false when the sentence matches the source lyric line', () => {
    expect(isCustomSentence(base)).toBe(false);
  });

  it('is true when the sentence was edited', () => {
    expect(isCustomSentence({ ...base, sentence: '今日は走らない' })).toBe(true);
  });

  it('is false for legacy cards without a source sentence', () => {
    expect(isCustomSentence({ ...base, sourceSentence: undefined })).toBe(false);
  });
});

describe('findHighlightIndex', () => {
  const tokens = [
    { surface: '今日', basicForm: '今日' },
    { surface: '走ら', basicForm: '走る' },
    { surface: 'ない', basicForm: 'ない' },
  ];

  it('prefers an exact surface match', () => {
    expect(findHighlightIndex(tokens, '走ら', '走る')).toBe(1);
  });

  it('falls back to the dictionary form', () => {
    expect(findHighlightIndex(tokens, 'missing', '走る')).toBe(1);
  });

  it('returns -1 when nothing matches', () => {
    expect(findHighlightIndex(tokens, 'missing', 'missing')).toBe(-1);
  });
});

describe('buildImageField', () => {
  it('returns the trimmed image URL', () => {
    expect(buildImageField({ image: '  https://example.com/a.png ' } as AnkiCard)).toBe(
      'https://example.com/a.png'
    );
  });

  it('returns an empty string when no image is set', () => {
    expect(buildImageField({} as AnkiCard)).toBe('');
  });

  it('escapes attribute-breaking characters', () => {
    expect(buildImageField({ image: 'https://x.test/?a=1&b="2"' } as AnkiCard)).toBe(
      'https://x.test/?a=1&amp;b=&quot;2&quot;'
    );
  });
});

describe('buildCsv', () => {
  const card: AnkiCard = {
    id: 'test-1',
    term: '走る',
    reading: 'はしる',
    surface: '走った',
    meaning: 'to run, to drive',
    sentence: '走った',
    sentenceFurigana: '<b><ruby>走<rt>はし</rt></ruby>った</b>',
    sentenceMeaning: 'I ran',
    notes: 'He said "hi"',
    image: 'https://example.com/cat.png',
    sourceTitle: 'Test Song',
    sourceArtist: 'Test Artist',
    addedAt: '2026-01-01T00:00:00.000Z',
  };

  it('writes the seven columns and the card content', async () => {
    const csv = await buildCsv([card]).text();
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Term,TermFurigana,Meaning,Sentence,SentenceMeaning,Notes,Image');
    expect(lines[1]).toContain('走る');
    expect(lines[1]).toContain('<ruby>走<rt>はし</rt></ruby>る');
    expect(lines[1]).toContain('"to run, to drive"');
    expect(lines[1]).toContain(
      '<b><ruby>走<rt>はし</rt></ruby>った</b><br><br>- Test Song + Test Artist'
    );
    expect(lines[1]).toContain('I ran');
    expect(lines[1]).toContain('He said &quot;hi&quot;');
    expect(lines[1]).toContain('https://example.com/cat.png');
  });

  it('omits the source line for a custom sentence', async () => {
    const custom: AnkiCard = {
      ...card,
      sentence: '今日は走らない',
      sourceSentence: '走った',
      sentenceFurigana: undefined,
    };
    const csv = await buildCsv([custom]).text();
    const lines = csv.split('\r\n');
    expect(lines[1]).toContain('今日は走らない');
    expect(lines[1]).not.toContain('Test Song');
  });

  it('quotes fields containing commas', async () => {
    const csv = await buildCsv([card]).text();
    expect(csv).toContain('"to run, to drive"');
  });

  it('rejects an empty selection', () => {
    expect(() => buildCsv([])).toThrow('No cards selected');
  });

  it('uses a matching csv filename', () => {
    expect(csvFileName('Kashi-gawa')).toMatch(/^kashi-gawa-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
