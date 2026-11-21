import React, { useState, useCallback, useEffect, useRef } from 'react';
import { KaraokeTokenState, Token } from '../types';
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
  isKaraoke?: boolean;
  activeLineIdx?: number;
  activeTokenIdx?: number;
  useWordHighlighting?: boolean;
  stickyOffset?: number;
  headerRef?: React.RefObject<HTMLDivElement | null>;
}

const LyricDisplayComponent: React.FC<LyricDisplayProps> = ({
  lines,
  onTokensChange,
  readingMode,
  isEditMode,
  detailMode,
  selectedToken,
  setSelectedToken,
  isKaraoke,
  activeLineIdx = -1,
  activeTokenIdx = -1,
  useWordHighlighting = false,
  stickyOffset = 0,
  headerRef,
}) => {
  const [splitTokenKey, setSplitTokenKey] = useState<string | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const manualScrollUntil = useRef(0);

  useEffect(() => {
    const markManual = () => {
      manualScrollUntil.current = Date.now() + 4000;
    };
    window.addEventListener('wheel', markManual, { passive: true });
    window.addEventListener('touchmove', markManual, { passive: true });
    return () => {
      window.removeEventListener('wheel', markManual);
      window.removeEventListener('touchmove', markManual);
    };
  }, []);

  useEffect(() => {
    if (!isKaraoke || activeLineIdx < 0) return;
    if (Date.now() < manualScrollUntil.current) return;

    const line = lineRefs.current[activeLineIdx];
    const container = line?.closest('main');
    if (!line || !container) return;

    const headerBottom = headerRef?.current?.getBoundingClientRect().bottom;
    const targetTop = (headerBottom ?? container.getBoundingClientRect().top) + 16;
    const delta = line.getBoundingClientRect().top - targetTop;
    if (Math.abs(delta) < 2) return;

    container.scrollTo({ top: container.scrollTop + delta, behavior: 'smooth' });
  }, [isKaraoke, activeLineIdx, stickyOffset, headerRef]);

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
  }, [setSelectedToken]);

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
          const isActiveLine = Boolean(isKaraoke) && lineIdx === activeLineIdx;
          const isPastLine = Boolean(isKaraoke) && activeLineIdx >= 0 && lineIdx < activeLineIdx;

          const karaokeStateAt = (tokenIdx: number): KaraokeTokenState | null => {
            if (!isKaraoke || !useWordHighlighting || lineIdx !== activeLineIdx) return null;
            if (tokenIdx < activeTokenIdx) return 'past';
            if (tokenIdx === activeTokenIdx) return 'active';
            return null;
          };

          return (
            <div
              key={lineIdx}
              ref={(el) => {
                lineRefs.current[lineIdx] = el;
              }}
              className={`flex flex-wrap gap-1 items-center px-[2%] first:rounded-t-xl last:rounded-b-xl transition-[background-color,opacity,box-shadow,transform] ${
                isActiveLine
                  ? 'relative z-10 bg-sky-100 py-2 md:py-3 shadow-lg ring-2 ring-inset ring-sky-300/70 rounded-lg'
                  : `py-1.5 ${isEven ? 'bg-white' : 'bg-gray-200'}`
              } ${isPastLine ? 'opacity-40' : ''} ${!isLast && !isActiveLine ? 'border-b border-gray-100' : ''}`}
            >
              <div
                className={`flex w-full flex-wrap items-center gap-1 origin-center transition-transform ${
                  isActiveLine ? 'scale-[1.03]' : ''
                }`}
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
                        karaokeState={karaokeStateAt(tokenIdx)}
                        size={isActiveLine ? 'large' : 'normal'}
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

export const LyricDisplay = React.memo(LyricDisplayComponent);
