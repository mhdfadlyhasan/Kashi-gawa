import { useState, useEffect, useRef, useCallback } from 'react';
import { Token } from '../types';

let kuromoji: any = null;
let tokenizer: any = null;

function loadKuromoji(): Promise<any> {
  if (tokenizer) return Promise.resolve(tokenizer);
  return new Promise((resolve) => {
    import('kuromoji').then((k) => {
      kuromoji = k;
      kuromoji.builder({ dicPath: '/dict' }).build((_err: any, t: any) => {
        tokenizer = t;
        resolve(tokenizer);
      });
    });
  });
}

export function useTokenizer() {
  const [ready, setReady] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    loadKuromoji().then(() => setReady(true));
  }, []);

  const tokenize = useCallback(async (text: string): Promise<Token[]> => {
    const t = await loadKuromoji();
    const rawTokens = t.tokenize(text);
    return rawTokens.map((tok: any) => ({
      word_id: tok.word_id,
      word_type: tok.word_type,
      surface_form: tok.surface_form,
      pos: tok.pos,
      pos_detail_1: tok.pos_detail_1,
      pos_detail_2: tok.pos_detail_2,
      pos_detail_3: tok.pos_detail_3,
      conjugated_type: tok.conjugated_type,
      conjugated_form: tok.conjugated_form,
      basic_form: tok.basic_form,
      reading: tok.reading,
      pronunciation: tok.pronunciation,
    }));
  }, []);

  const tokenizeLines = useCallback(
    async (text: string): Promise<Token[][]> => {
      const lines = text.split(/\r?\n/);
      const result: Token[][] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const toks = await tokenize(trimmed);
        result.push(toks);
      }
      return result;
    },
    [tokenize]
  );

  return { ready, tokenize, tokenizeLines };
}
