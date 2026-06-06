import React from 'react';
import { Token } from '../types';
import { getGrammarType, getColorClasses } from '../lib/colorMap';

interface WordTokenProps {
  token: Token;
  onClick: () => void;
}

export const WordToken: React.FC<WordTokenProps> = ({ token, onClick }) => {
  const grammarType = getGrammarType(token.pos);
  const colorClasses = getColorClasses(grammarType);

  return (
    <button
      onClick={onClick}
      className={`inline-block px-2 py-1 border rounded-md text-base font-medium transition hover:opacity-80 hover:shadow-sm ${colorClasses}`}
    >
      {token.surface_form}
    </button>
  );
};
