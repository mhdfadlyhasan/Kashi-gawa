import { GrammarType } from '../types';

export function getGrammarType(pos: string): GrammarType {
  if (pos === '名詞' || pos === '代名詞' || pos === '固有名詞') return 'noun';
  if (pos === '助詞') return 'particle';
  if (pos === '動詞') return 'verb';
  if (pos === '形容詞' || pos === '形容動詞') return 'adjective';
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
    default:
      return 'border-gray-200 bg-gray-50';
  }
}
