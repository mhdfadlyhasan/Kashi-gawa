import React from 'react';
import { Token } from '../types';
import { ReadingMode, convertReading } from '../lib/kana';
import { useWordBreakdown } from '../hooks/useWordBreakdown';

interface CompactBreakdownProps {
  token: Token;
  onClose: () => void;
  readingMode: ReadingMode;
}

export const CompactBreakdown: React.FC<CompactBreakdownProps> = ({
  token,
  onClose,
  readingMode,
}) => {
  const breakdown = useWordBreakdown(token);

  const displayedReading = token.reading
    ? convertReading(token.reading, readingMode === 'normal' ? 'katakana' : readingMode)
    : '';

  return (
    <div className="sticky top-0 z-20 bg-white border border-gray-300 rounded-lg shadow-lg p-3 md:p-4 mb-4 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-lg" />
      <div className="flex items-start justify-between gap-2 pl-2">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap min-w-0">
          <div className="text-xl md:text-2xl font-bold text-gray-900">
            {token.surface_form}
          </div>
          {displayedReading && (
            <div className="text-sm text-gray-500">{displayedReading}</div>
          )}
          {breakdown?.grammarExplanation && (
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
              {breakdown.grammarExplanation}
            </div>
          )}
          {breakdown?.dictionaryForm && breakdown.dictionaryForm !== token.surface_form && (
            <div className="text-sm text-gray-700">
              <span className="text-xs text-gray-400 uppercase mr-1">Dict</span>
              {breakdown.dictionaryForm}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1 flex-shrink-0"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {breakdown ? (
        <div className="mt-2 flex items-center gap-2 flex-wrap pl-2">
          <a
            href={`https://jisho.org/search/${encodeURIComponent(
              breakdown.dictionaryForm
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 underline flex-shrink-0"
          >
            Jisho ↗
          </a>
          {breakdown.meanings.length > 0 ? (
            <div className="text-sm text-green-900 flex gap-1 flex-wrap">
              {breakdown.meanings.slice(0, 3).map((m, i) => (
                <span
                  key={i}
                  className="bg-green-50 border border-green-200 rounded px-2 py-0.5"
                >
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No translation found for {breakdown.dictionaryForm}.
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2 text-sm text-gray-400 pl-2">Loading...</div>
      )}
    </div>
  );
};
