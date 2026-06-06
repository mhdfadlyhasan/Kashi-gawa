import React, { useEffect, useState } from 'react';
import { Token, WordBreakdown } from '../types';
import { searchJisho } from '../lib/jisho';
import { findGrammarExplanation } from '../lib/grammarDict';

interface BreakdownModalProps {
  token: Token;
  onClose: () => void;
}

export const BreakdownModal: React.FC<BreakdownModalProps> = ({
  token,
  onClose,
}) => {
  const [breakdown, setBreakdown] = useState<WordBreakdown | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const jisho = await searchJisho(token.basic_form || token.surface_form);
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
          {token.reading && (
            <div className="text-lg text-gray-500">{token.reading}</div>
          )}
        </div>

        {breakdown ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Dictionary Form
              </div>
              <div className="text-lg font-medium">{breakdown.dictionaryForm}</div>
            </div>

            {breakdown.grammarExplanation && (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-xs text-yellow-700 uppercase tracking-wide mb-1">
                  Grammar
                </div>
                <div className="text-base font-medium text-yellow-900">
                  {breakdown.grammarExplanation}
                </div>
              </div>
            )}

            {breakdown.meanings.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-xs text-green-700 uppercase tracking-wide mb-1">
                  Meaning
                </div>
                <ul className="list-disc list-inside text-base text-green-900 space-y-1">
                  {breakdown.meanings.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        )}
      </div>
    </div>
  );
};
