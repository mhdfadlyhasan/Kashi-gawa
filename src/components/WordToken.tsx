import React from 'react';
import { Token } from '../types';
import { getGrammarType, getColorClasses } from '../lib/colorMap';
import { ReadingMode, convertReading } from '../lib/kana';

interface WordTokenProps {
  token: Token;
  onClick: () => void;
  readingMode: ReadingMode;
}

export const WordToken: React.FC<WordTokenProps> = ({ token, onClick, readingMode }) => {
  const grammarType = getGrammarType(token.pos);
  const colorClasses = getColorClasses(grammarType);

  const displayReading = (() => {
    if (!token.reading) return null;
    if (readingMode === 'katakana') {
      return token.reading;
    }
    if (readingMode === 'hiragana') {
      return convertReading(token.reading, 'hiragana');
    }
    return null;
  })();

  const displayText = readingMode === 'romaji'
    ? convertReading(token.reading || token.surface_form, 'romaji')
    : token.surface_form;

  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-col items-center px-2 py-1 border rounded-md font-medium transition hover:opacity-80 hover:shadow-sm ${colorClasses}`}
    >
      <span className="text-base leading-tight">{displayText}</span>
      {displayReading && (
        <span className="text-xs text-gray-500 mt-0.5 leading-tight">
          {displayReading}
        </span>
      )}
    </button>
  );
};
