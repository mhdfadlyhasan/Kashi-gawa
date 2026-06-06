import React from 'react';
import { Token } from '../types';
import { getGrammarType, getColorClasses } from '../lib/colorMap';
import { ReadingMode, convertReading } from '../lib/kana';

interface WordTokenProps {
  token: Token;
  onClick: () => void;
  readingMode: ReadingMode;
  isSplitMode: boolean;
  isEditMode?: boolean;
  onSplit?: (index: number) => void;
  onEnterSplitMode?: () => void;
}

export const WordToken: React.FC<WordTokenProps> = ({
  token,
  onClick,
  readingMode,
  isSplitMode,
  isEditMode,
  onSplit,
  onEnterSplitMode,
}) => {
  const grammarType = getGrammarType(token.pos);
  const colorClasses = getColorClasses(grammarType);
  const chars = token.surface_form.split('');

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

  if (isSplitMode && chars.length > 1 && readingMode !== 'romaji') {
    return (
      <span
        className={`inline-block px-2 py-1 border rounded-md text-base font-medium cursor-pointer hover:opacity-80 hover:shadow-sm ${colorClasses}`}
      >
        {chars.map((char, i) => (
          <React.Fragment key={i}>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onSplit?.(i + 1);
              }}
              className="hover:bg-black/10 rounded px-0.5 transition"
              title="Click to split here"
            >
              {char}
            </span>
            {i < chars.length - 1 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onSplit?.(i + 1);
                }}
                className="inline-block w-px h-4 mx-0.5 bg-gray-400/60 cursor-pointer hover:bg-gray-600 hover:w-0.5 transition"
                title="Click to split here"
              />
            )}
          </React.Fragment>
        ))}
      </span>
    );
  }

  return (
    <span className="relative inline-block">
      <button
        onClick={onClick}
        className={`inline-flex flex-col items-center px-2 py-1 border rounded-md font-medium transition hover:opacity-80 hover:shadow-sm ${colorClasses}`}
      >
        {displayReading && (
          <span className="text-[9px] text-gray-500 leading-tight mb-0">
            {displayReading}
          </span>
        )}
        <span className="text-base leading-tight">{displayText}</span>
      </button>
      {isEditMode && chars.length > 1 && onEnterSplitMode && readingMode !== 'romaji' && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onEnterSplitMode();
          }}
          className="absolute -top-1.5 -right-1.5 text-[9px] bg-white border border-gray-300 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer shadow-sm hover:bg-gray-50 z-10"
          title="Split word"
        >
          ✂️
        </span>
      )}
    </span>
  );
};
