import React, { useState } from 'react';
import { Token } from '../types';
import { getGrammarType, getColorClasses } from '../lib/colorMap';

interface WordTokenProps {
  token: Token;
  onClick: () => void;
  isSplitMode: boolean;
  onSplit?: (index: number) => void;
  onEnterSplitMode?: () => void;
}

export const WordToken: React.FC<WordTokenProps> = ({ token, onClick, isSplitMode, onSplit, onEnterSplitMode }) => {
  const grammarType = getGrammarType(token.pos);
  const colorClasses = getColorClasses(grammarType);
  const chars = token.surface_form.split('');
  const [hovered, setHovered] = useState(false);

  if (isSplitMode && chars.length > 1) {
    return (
      <span
        className={`inline-block px-2 py-1 border rounded-md text-base font-medium cursor-pointer hover:opacity-80 hover:shadow-sm ${colorClasses}`}
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
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`inline-block px-2 py-1 border rounded-md text-base font-medium transition hover:opacity-80 hover:shadow-sm ${colorClasses}`}
      >
        {token.surface_form}
      </button>
      {hovered && chars.length > 1 && onEnterSplitMode && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onEnterSplitMode();
          }}
          className="absolute -top-1.5 -right-1.5 text-[9px] bg-white border border-gray-300 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer shadow-sm hover:bg-gray-50 z-10"
          title="Split word"
        >
          ✂️
        </span>
      )}
    </span>
  );
};
