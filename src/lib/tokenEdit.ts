import { Token } from '../types';

export function mergeAdjacentTokens(left: Token, right: Token): Token {
  const surfaceForm = left.surface_form + right.surface_form;
  return {
    ...left,
    surface_form: surfaceForm,
    reading: (left.reading || '') + (right.reading || ''),
    pronunciation: (left.pronunciation || '') + (right.pronunciation || ''),
    basic_form: surfaceForm,
    conjugated_type: '*',
    conjugated_form: '*',
  };
}

export function applyTokenReading(
  lines: Token[][],
  lineIdx: number,
  target: Token,
  reading: string
): Token[][] {
  return lines.map((line, li) => {
    if (li !== lineIdx) return line;
    let changed = false;
    const next = line.map((token) => {
      if (token !== target) return token;
      changed = true;
      return { ...token, reading, pronunciation: reading };
    });
    return changed ? next : line;
  });
}

export function splitTokenAt(token: Token, splitAt: number): [Token, Token] | null {
  const text = token.surface_form;
  if (splitAt <= 0 || splitAt >= text.length) return null;

  const leftText = text.slice(0, splitAt);
  const rightText = text.slice(splitAt);

  const left: Token = {
    ...token,
    surface_form: leftText,
    reading: (token.reading || '').slice(0, splitAt),
    pronunciation: (token.pronunciation || '').slice(0, splitAt),
    basic_form: leftText,
    conjugated_type: '*',
    conjugated_form: '*',
  };
  const right: Token = {
    ...token,
    surface_form: rightText,
    reading: (token.reading || '').slice(splitAt),
    pronunciation: (token.pronunciation || '').slice(splitAt),
    basic_form: rightText,
    conjugated_type: '*',
    conjugated_form: '*',
  };

  return [left, right];
}
