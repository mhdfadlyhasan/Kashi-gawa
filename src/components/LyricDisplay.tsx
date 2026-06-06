import React, { useState, useCallback, useEffect } from 'react';
import { Token } from '../types';
import { ReadingMode } from '../lib/kana';
import { WordToken } from './WordToken';
import { BreakdownModal } from './BreakdownModal';
import { DetailMode } from '../hooks/useDetailMode';

interface LyricDisplayProps {
  lines: Token[][];
  onTokensChange?: (newLines: Token[][]) => void;
  readingMode: ReadingMode;
  isEditMode?: boolean;
  detailMode: DetailMode;
  selectedToken: Token | null;
  setSelectedToken: (token: Token | null) => void;
}

export const LyricDisplay: React.FC<LyricDisplayProps> = ({ lines, onTokensChange, readingMode, isEditMode, detailMode, selectedToken, setSelectedToken }) => {
  const [splitTokenKey, setSplitTokenKey] = useState<string | null>(null);

  // Close split mode / compact panel on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSplitTokenKey(null);
        setSelectedToken(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMerge = useCallback(
    (lineIdx: number, tokenIdx: number) => {
      const newLines = lines.map((line, li) => {
        if (li !== lineIdx) return line;
        const newTokens = [...line];
        if (tokenIdx >= newTokens.length - 1) return line;
        const left = newTokens[tokenIdx];
        const right = newTokens[tokenIdx + 1];
        const merged: Token = {
          ...left,
          surface_form: left.surface_form + right.surface_form,
          reading: (left.reading || '') + (right.reading || ''),
          pronunciation: (left.pronunciation || '') + (right.pronunciation || ''),
        };
        newTokens.splice(tokenIdx, 2, merged);
        return newTokens;
      });
      onTokensChange?.(newLines);
    },
    [lines, onTokensChange]
  );

  const handleSplit = useCallback(
    (lineIdx: number, tokenIdx: number, splitAt: number) => {
      const newLines = lines.map((line, li) => {
        if (li !== lineIdx) return line;
        const token = line[tokenIdx];
        const text = token.surface_form;
        if (splitAt <= 0 || splitAt >= text.length) return line;
        const leftText = text.slice(0, splitAt);
        const rightText = text.slice(splitAt);

        const left: Token = {
          ...token,
          surface_form: leftText,
          reading: (token.reading || '').slice(0, splitAt),
          pronunciation: (token.pronunciation || '').slice(0, splitAt),
        };
        const right: Token = {
          ...token,
          surface_form: rightText,
          reading: (token.reading || '').slice(splitAt),
          pronunciation: (token.pronunciation || '').slice(splitAt),
        };

        const newTokens = [...line];
        newTokens.splice(tokenIdx, 1, left, right);
        return newTokens;
      });
      onTokensChange?.(newLines);
      setSplitTokenKey(null);
    },
    [lines, onTokensChange]
  );

  return (
    <div className="space-y-4 leading-loose">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {lines.map((line, lineIdx) => {
          const isEven = lineIdx % 2 === 0;
          const isLast = lineIdx === lines.length - 1;
          return (
            <div
              key={lineIdx}
              className={`flex flex-wrap gap-1 items-center py-1.5 ${isEven ? 'bg-white' : 'bg-gray-200'} ${!isLast ? 'border-b border-gray-100' : ''}`}
            >
              {line.map((token, tokenIdx) => {
                const tokenKey = `${lineIdx}-${tokenIdx}`;
                const isSplitMode = splitTokenKey === tokenKey;
                return (
                  <React.Fragment key={tokenKey}>
                    <WordToken
                      token={token}
                      readingMode={readingMode}
                      isSplitMode={isSplitMode}
                      isEditMode={isEditMode}
                      onSplit={(splitAt) => handleSplit(lineIdx, tokenIdx, splitAt)}
                      onClick={() => {
                        if (isSplitMode) {
                          setSplitTokenKey(null);
                        } else {
                          setSelectedToken(selectedToken === token ? null : token);
                        }
                      }}
                      onEnterSplitMode={() => {
                        setSplitTokenKey(tokenKey);
                      }}
                    />
                    {tokenIdx < line.length - 1 && (
                      <div
                        className={`relative w-4 md:w-1 h-8 md:h-6 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded transition ${isEditMode ? 'flex' : 'hidden'}`}
                        onClick={() => handleMerge(lineIdx, tokenIdx)}
                      >
                        <span className="text-[10px] leading-none text-gray-400 bg-white border border-gray-200 rounded px-1 py-0.5 shadow-sm z-10 opacity-100">
                          +
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          );
        })}
      </div>

      {detailMode === 'popup' && selectedToken && (
        <BreakdownModal
          token={selectedToken}
          onClose={() => setSelectedToken(null)}
          readingMode={readingMode}
        />
      )}
    </div>
  );
};
