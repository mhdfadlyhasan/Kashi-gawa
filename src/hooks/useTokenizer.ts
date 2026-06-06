import { useState, useEffect, useRef, useCallback } from 'react';
import { Token } from '../types';

let kuromoji: any = null;
let tokenizer: any = null;

async function patchBrowserDictionaryLoader() {
  const mod = await import('kuromoji/src/loader/BrowserDictionaryLoader.js');
  const BrowserDictionaryLoader = (mod as any).default || mod;
  if (typeof BrowserDictionaryLoader !== 'function') return;

  BrowserDictionaryLoader.prototype.loadArrayBuffer = async function (
    url: string,
    callback: (err: any, buffer: ArrayBuffer | null) => void
  ) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(res.statusText);
      }
      const arraybuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arraybuffer);

      // Gzip magic: 0x1f 0x8b
      if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
        // Raw gzip bytes — manually decompress
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        writer.write(bytes);
        writer.close();
        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        let totalLen = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          totalLen += value.length;
        }
        const result = new Uint8Array(totalLen);
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        callback(null, result.buffer);
      } else {
        // Already decompressed by browser
        callback(null, arraybuffer);
      }
    } catch (err) {
      callback(err, null);
    }
  };
}

export function loadKuromoji(): Promise<any> {
  if (tokenizer) return Promise.resolve(tokenizer);
  return new Promise((resolve) => {
    patchBrowserDictionaryLoader().then(() => {
      import('kuromoji').then((k) => {
        kuromoji = k;
        const dicPath = (import.meta as any).env.BASE_URL + 'dict';
        kuromoji.builder({ dicPath }).build((_err: any, t: any) => {
          tokenizer = t;
          resolve(tokenizer);
        });
      });
    });
  });
}

export async function tokenizeText(text: string): Promise<Token[]> {
  const t = await loadKuromoji();
  const rawTokens = t.tokenize(text);
  const mapped: Token[] = rawTokens.map((tok: any) => ({
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

  // Merge verb stems with immediately following て/た/auxiliaries
  // so that e.g. 見て is one token instead of み + て
  const merged: Token[] = [];
  const auxSuffixes = new Set([
    'て', 'で', 'た', 'だ', 'たら', 'ても', 'でも', 'ては', 'では', 'たり', 'たい',
    'ない', 'ます', 'ませ', 'ん',
  ]);

  for (let i = 0; i < mapped.length; i++) {
    const current = mapped[i];
    const next = mapped[i + 1];

    // Forward merge: verb/aux + auxiliary suffix
    const isAux = next && (next.pos === '助動詞' || next.pos === '助詞');
    const isVerbLike = current.pos === '動詞' || current.pos === '助動詞';

    if (
      next &&
      isVerbLike &&
      isAux &&
      auxSuffixes.has(next.surface_form)
    ) {
      merged.push({
        ...current,
        surface_form: current.surface_form + next.surface_form,
        reading: (current.reading || '') + (next.reading || ''),
        pronunciation: (current.pronunciation || '') + (next.pronunciation || ''),
        conjugated_form: (next.surface_form === 'て' || next.surface_form === 'で') ? '連用テ接続' : current.conjugated_form,
      });
      i++; // skip next
      continue;
    }

      // Backward merge: ない / ん attach to the previous token even if it was mis-tagged.
      // We block pure particles (except て/で which form ~ていない / ~でない).
      const backwardMergeForms = new Set(['ない', 'ん']);
      if (
        backwardMergeForms.has(current.surface_form) &&
        (current.pos === '助動詞' || current.pos === '形容詞') &&
        merged.length > 0
      ) {
      const prev = merged[merged.length - 1];
      const allowedParticleExceptions = new Set(['て', 'で']);
      const isBlockingParticle = prev.pos === '助詞' && !allowedParticleExceptions.has(prev.surface_form);

      if (prev.pos !== '記号' && !isBlockingParticle) {
        const isPrevVerbLike = prev.pos === '動詞' || prev.pos === '助動詞';
        merged[merged.length - 1] = {
          ...prev,
          surface_form: prev.surface_form + current.surface_form,
          reading: (prev.reading || '') + (current.reading || ''),
          pronunciation: (prev.pronunciation || '') + (current.pronunciation || ''),
          // If the previous token was mis-tagged (e.g. noun), force it to verb
          // so the color coding stays consistent for negative forms.
          pos: isPrevVerbLike ? prev.pos : '動詞',
        };
        continue;
      }
    }

    merged.push(current);
  }

  // Filter out empty/whitespace-only tokens and pure symbols/punctuation
  return merged.filter((tok: Token) => {
    if (!tok.surface_form || tok.surface_form.trim() === '') return false;
    if (tok.pos === '記号') return false;
    // Fallback: filter out tokens made only of punctuation/whitespace/special chars
    if (/^[\s\p{P}\p{S}]+$/u.test(tok.surface_form)) return false;
    return true;
  });
}

export async function tokenizeLinesText(text: string): Promise<Token[][]> {
  const lines = text.split(/\r?\n/);
  const result: Token[][] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const toks = await tokenizeText(trimmed);
    result.push(toks);
  }
  return result;
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
    return tokenizeText(text);
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

  // Re-tokenize a single surface form (used after manual split/merge)
  const tokenizeSingle = useCallback(
    async (text: string): Promise<Token[]> => {
      const t = await loadKuromoji();
      const raw = t.tokenize(text);
      const mapped: Token[] = raw.map((tok: any) => ({
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

      // If Kuromoji returned nothing useful, create a single fallback token
      if (mapped.length === 0) {
        return [
          {
            word_id: 0,
            word_type: 'UNKNOWN',
            surface_form: text,
            pos: '名詞',
            pos_detail_1: '一般',
            pos_detail_2: '',
            pos_detail_3: '',
            conjugated_type: '',
            conjugated_form: '',
            basic_form: text,
            reading: '',
            pronunciation: '',
          },
        ];
      }

      // Apply same merge rules as full tokenize
      const merged: Token[] = [];
      const auxSuffixes = new Set([
      'て', 'で', 'た', 'だ', 'たら', 'ても', 'でも', 'ては', 'では', 'たり', 'たい',
      'ない', 'ます', 'ませ', 'ん',
    ]);
      for (let i = 0; i < mapped.length; i++) {
        const current = mapped[i];
        const next = mapped[i + 1];
        const isAux = next && (next.pos === '助動詞' || next.pos === '助詞');
        const isVerbLike = current.pos === '動詞' || current.pos === '助動詞';
        if (
          next &&
          isVerbLike &&
          isAux &&
          auxSuffixes.has(next.surface_form)
        ) {
          merged.push({
            ...current,
            surface_form: current.surface_form + next.surface_form,
            reading: (current.reading || '') + (next.reading || ''),
            pronunciation: (current.pronunciation || '') + (next.pronunciation || ''),
            conjugated_form: (next.surface_form === 'て' || next.surface_form === 'で') ? '連用テ接続' : current.conjugated_form,
          });
          i++;
          continue;
        }
        const backwardMergeForms = new Set(['ない', 'ん']);
        if (
          backwardMergeForms.has(current.surface_form) &&
          (current.pos === '助動詞' || current.pos === '形容詞') &&
          merged.length > 0
        ) {
          const prev = merged[merged.length - 1];
          const allowedParticleExceptions = new Set(['て', 'で']);
          const isBlockingParticle = prev.pos === '助詞' && !allowedParticleExceptions.has(prev.surface_form);
          if (prev.pos !== '記号' && !isBlockingParticle) {
            const isPrevVerbLike = prev.pos === '動詞' || prev.pos === '助動詞';
            merged[merged.length - 1] = {
              ...prev,
              surface_form: prev.surface_form + current.surface_form,
              reading: (prev.reading || '') + (current.reading || ''),
              pronunciation: (prev.pronunciation || '') + (current.pronunciation || ''),
              pos: isPrevVerbLike ? prev.pos : '動詞',
            };
            continue;
          }
        }
        merged.push(current);
      }

      return merged.filter((tok) => {
        if (!tok.surface_form || tok.surface_form.trim() === '') return false;
        if (tok.pos === '記号') return false;
        if (/^[\s\p{P}\p{S}]+$/u.test(tok.surface_form)) return false;
        return true;
      });
    },
    []
  );

  return { ready, tokenize, tokenizeLines, tokenizeSingle };
}
