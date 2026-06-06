import { useEffect, useState } from 'react';
import { Token, WordBreakdown } from '../types';
import { searchJisho } from '../lib/jisho';
import { findGrammarExplanation } from '../lib/grammarDict';

export function useWordBreakdown(token: Token | null): WordBreakdown | null {
  const [breakdown, setBreakdown] = useState<WordBreakdown | null>(null);

  useEffect(() => {
    if (!token) {
      setBreakdown(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const searchForm = token.basic_form !== '*' ? token.basic_form : null;
      let jisho = await searchJisho(searchForm || token.surface_form);
      if (!jisho) {
        jisho = await searchJisho(token.surface_form);
      }
      if (cancelled) return;

      const meanings =
        jisho?.senses.flatMap((s) => s.english_definitions).slice(0, 5) || [];

      const matchedWord = jisho?.japanese[0]?.word;
      const dictionaryForm =
        matchedWord || searchForm || token.surface_form;

      setBreakdown({
        surfaceForm: token.surface_form,
        reading: token.reading || '',
        dictionaryForm,
        grammarExplanation: findGrammarExplanation(token.surface_form),
        meanings,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return breakdown;
}
