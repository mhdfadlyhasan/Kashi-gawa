import React from 'react';
import { Token } from '../types';
import { ReadingMode, convertReading } from '../lib/kana';
import { getPosLabel } from '../lib/colorMap';
import { useWordBreakdown } from '../hooks/useWordBreakdown';

interface BreakdownModalProps {
  token: Token;
  onClose: () => void;
  readingMode: ReadingMode;
}

export const BreakdownModal: React.FC<BreakdownModalProps> = ({
  token,
  onClose,
  readingMode,
}) => {
  const breakdown = useWordBreakdown(token);

  const displayedReading = token.reading
    ? convertReading(token.reading, readingMode === 'normal' ? 'katakana' : readingMode)
    : '';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div
          className="bg-white rounded-xl shadow-2xl max-w-sm md:max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>

          <div className="text-center mb-6">
            <div className="text-3xl font-bold mb-2">{token.surface_form}</div>
            {displayedReading && (
              <div className="text-lg text-gray-500">
                {displayedReading}
              </div>
            )}
            <div className="text-sm text-gray-400 mt-1">
              {getPosLabel(token.pos)}
            </div>
          </div>

          {breakdown ? (
            <div className="space-y-4">
              {breakdown.grammarExplanation && (
                <div className="text-center text-sm text-gray-500">
                  {breakdown.grammarExplanation}
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Dictionary Form
                </div>
                <div className="text-lg font-medium">{breakdown.dictionaryForm}</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-xs text-green-700 uppercase tracking-wide mb-1">
                  Translation
                </div>
                {breakdown.meanings.length > 0 ? (
                  <ul className="list-disc list-inside text-base text-green-900 space-y-1">
                    {breakdown.meanings.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-green-800 italic">
                    No translation found for {breakdown.dictionaryForm}.
                  </div>
                )}
              </div>

              <a
                href={`https://jisho.org/search/${encodeURIComponent(breakdown.dictionaryForm)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2 px-4 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                Search in Jisho ↗
              </a>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          )}
        </div>
      </div>
    </div>
  );
};
