import { GrammarType } from '../types';

export function getPosLabel(pos: string): string {
  const labels: Record<string, string> = {
    '名詞': 'Noun',
    '代名詞': 'Pronoun',
    '固有名詞': 'Proper Noun',
    '助詞': 'Particle',
    '動詞': 'Verb',
    '形容詞': 'Adjective (I-adjective)',
    '形容動詞': 'Adjective (Na-adjective)',
    '副詞': 'Adverb',
    '感動詞': 'Interjection',
    '連体詞': 'Adnominal',
    '助動詞': 'Auxiliary Verb',
    '接頭詞': 'Prefix',
    '接尾詞': 'Suffix',
    '接続詞': 'Conjunction',
    '記号': 'Symbol',
    'フィラー': 'Filler',
    'その他': 'Other',
  };
  return labels[pos] || pos;
}

export function getGrammarType(pos: string): GrammarType {
  if (pos === '名詞' || pos === '代名詞' || pos === '固有名詞') return 'noun';
  if (pos === '助詞') return 'particle';
  if (pos === '動詞') return 'verb';
  if (pos === '形容詞' || pos === '形容動詞') return 'adjective';
  if (pos === '副詞') return 'adverb';
  if (pos === '感動詞') return 'interjection';
  if (pos === '連体詞') return 'adnominal';
  return 'other';
}

export function getColorClasses(grammarType: GrammarType): string {
  switch (grammarType) {
    case 'noun':
      return 'border-blue-400 bg-blue-100';
    case 'particle':
      return 'border-yellow-400 bg-yellow-100';
    case 'verb':
      return 'border-green-400 bg-green-100';
    case 'adjective':
      return 'border-red-400 bg-red-100';
    case 'adverb':
      return 'border-purple-400 bg-purple-100';
    case 'interjection':
      return 'border-orange-400 bg-orange-100';
    case 'adnominal':
      return 'border-pink-400 bg-pink-100';
    default:
      return 'border-gray-200 bg-gray-50';
  }
}
