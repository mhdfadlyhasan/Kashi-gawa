import React, { useEffect, useState } from 'react';
import { Token, WordBreakdown } from '../types';
import { searchJisho } from '../lib/jisho';
import { findGrammarExplanation } from '../lib/grammarDict';
import { ReadingMode, convertReading } from '../lib/kana';

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
  const [breakdown, setBreakdown] = useState<WordBreakdown | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let jisho = await searchJisho(token.basic_form || token.surface_form);
      if (!jisho) {
        jisho = await searchJisho(token.surface_form);
      }
      if (cancelled) return;

      const meanings =
        jisho?.senses.flatMap((s) => s.english_definitions).slice(0, 5) || [];

      setBreakdown({
        surfaceForm: token.surface_form,
        reading: token.reading || '',
        dictionaryForm: token.basic_form || token.surface_form,
        grammarExplanation: findGrammarExplanation(token.surface_form),
        meanings,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const displayedReading = token.reading
    ? convertReading(token.reading, readingMode === 'normal' ? 'katakana' : readingMode)
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
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
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        )}
      </div>
    </div>
  );
};
