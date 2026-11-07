import { describe, expect, it } from 'vitest';
import { getPosLabel, getGrammarType, getColorClasses } from './colorMap';

describe('getPosLabel', () => {
  it('maps known part-of-speech tags to English labels', () => {
    expect(getPosLabel('名詞')).toBe('Noun');
    expect(getPosLabel('形容詞')).toBe('Adjective (I-adjective)');
    expect(getPosLabel('形容動詞')).toBe('Adjective (Na-adjective)');
  });

  it('falls back to the raw tag when unknown', () => {
    expect(getPosLabel('謎の品詞')).toBe('謎の品詞');
  });
});

describe('getGrammarType', () => {
  it('groups nouns, pronouns, and proper nouns as noun', () => {
    expect(getGrammarType('名詞')).toBe('noun');
    expect(getGrammarType('代名詞')).toBe('noun');
    expect(getGrammarType('固有名詞')).toBe('noun');
  });

  it('maps particles', () => {
    expect(getGrammarType('助詞')).toBe('particle');
  });

  it('maps verbs', () => {
    expect(getGrammarType('動詞')).toBe('verb');
  });

  it('maps both adjective types', () => {
    expect(getGrammarType('形容詞')).toBe('adjective');
    expect(getGrammarType('形容動詞')).toBe('adjective');
  });

  it('maps adverbs, interjections, and adnominals', () => {
    expect(getGrammarType('副詞')).toBe('adverb');
    expect(getGrammarType('感動詞')).toBe('interjection');
    expect(getGrammarType('連体詞')).toBe('adnominal');
  });

  it('maps everything else to other', () => {
    expect(getGrammarType('助動詞')).toBe('other');
    expect(getGrammarType('記号')).toBe('other');
  });
});

describe('getColorClasses', () => {
  it('returns the expected classes for each grammar type', () => {
    expect(getColorClasses('noun')).toBe('border-blue-400 bg-blue-100');
    expect(getColorClasses('particle')).toBe('border-yellow-400 bg-yellow-100');
    expect(getColorClasses('verb')).toBe('border-green-400 bg-green-100');
    expect(getColorClasses('adjective')).toBe('border-red-400 bg-red-100');
    expect(getColorClasses('adverb')).toBe('border-purple-400 bg-purple-100');
    expect(getColorClasses('interjection')).toBe('border-orange-400 bg-orange-100');
    expect(getColorClasses('adnominal')).toBe('border-pink-400 bg-pink-100');
  });

  it('returns the default gray classes for other', () => {
    expect(getColorClasses('other')).toBe('border-gray-200 bg-gray-50');
  });
});
