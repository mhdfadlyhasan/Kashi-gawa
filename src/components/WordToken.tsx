import React from 'react';
import { KaraokeTokenState, Token } from '../types';
import { getGrammarType, getColorClasses } from '../lib/colorMap';
import { ReadingMode, convertReading } from '../lib/kana';

interface WordTokenProps {
  token: Token;
  onClick: () => void;
  readingMode: ReadingMode;
  isSplitMode: boolean;
  isEditMode?: boolean;
  karaokeState?: KaraokeTokenState | null;
  size?: 'normal' | 'large';
  onSplit?: (index: number) => void;
  onEnterSplitMode?: () => void;
}

export const WordToken: React.FC<WordTokenProps> = ({
  token,
  onClick,
  readingMode,
  isSplitMode,
  karaokeState,
  size = 'normal',
  onSplit,
}) => {
  const grammarType = getGrammarType(token.pos);
  const colorClasses = getColorClasses(grammarType);
  const chars = token.surface_form.split('');
  const isPunctuation = token.pos === '記号' || /^[\s\p{P}\p{S}]+$/u.test(token.surface_form);
  const karaokeClasses =
    karaokeState === 'active'
      ? 'ring-2 ring-sky-500 ring-offset-1 scale-105 z-10'
      : karaokeState === 'past'
        ? 'opacity-40'
        : '';
  const isLarge = size === 'large';
  const mainTextClass = isLarge ? 'text-lg' : 'text-base';
  const readingClass = isLarge ? 'text-[10px]' : 'text-[9px]';
  const paddingClass = isLarge ? 'px-2.5 py-1.5' : 'px-2 py-1';

  const displayReading = (() => {
    if (!token.reading) return null;
    if (readingMode === 'katakana') {
      return token.reading;
    }
    if (readingMode === 'hiragana') {
      return convertReading(token.reading, 'hiragana');
    }
    if (readingMode === 'furigana') {
      return convertReading(token.reading, 'furigana');
    }
    return null;
  })();

  const displayText =
    readingMode === 'romaji'
      ? convertReading(token.reading || token.surface_form, 'romaji')
      : token.surface_form;

  if (isPunctuation) {
    return (
      <span
        className={`inline-block font-medium px-0.5 transition-opacity ${mainTextClass} ${karaokeClasses}`}
      >
        {token.surface_form}
      </span>
    );
  }

  if (isSplitMode && chars.length > 1 && readingMode !== 'romaji') {
    return (
      <span
        className={`inline-block border rounded-md font-medium cursor-pointer hover:opacity-80 hover:shadow-sm transition ${paddingClass} ${mainTextClass} ${karaokeClasses} ${colorClasses}`}
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
        className={`inline-flex flex-col items-center border rounded-md font-medium transition hover:opacity-80 hover:shadow-sm ${paddingClass} ${karaokeClasses} ${colorClasses}`}
      >
        {displayReading && (
          <span className={`${readingClass} text-gray-500 leading-tight mb-0`}>
            {displayReading}
          </span>
        )}
        <span className={`${mainTextClass} leading-tight`}>{displayText}</span>
      </button>
    </span>
  );
};
