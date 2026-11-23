import React, { useState, useCallback, useEffect, useRef } from 'react';
import { KaraokeTokenState, Token, TokenSelection, WordBreakdown } from '../types';
import { ReadingMode, hiraganaToKatakana } from '../lib/kana';
import { WordToken } from './WordToken';
import { BreakdownModal } from './BreakdownModal';
import { DetailMode } from '../hooks/useDetailMode';
import { applyTokenReading, mergeAdjacentTokens, splitTokenAt } from '../lib/tokenEdit';
import { lookupLocalReading } from '../lib/jisho';

interface LyricDisplayProps {
  lines: Token[][];
  onTokensChange?: (newLines: Token[][]) => void;
  readingMode: ReadingMode;
  isEditMode?: boolean;
  detailMode: DetailMode;
  selectedToken: TokenSelection | null;
  setSelectedToken: (selection: TokenSelection | null) => void;
  onAddToAnki?: (breakdown: WordBreakdown) => void;
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
  onAddToAnki,
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
      const line = lines[lineIdx];
      if (!line || tokenIdx >= line.length - 1) return;

      const merged = mergeAdjacentTokens(line[tokenIdx], line[tokenIdx + 1]);
      const newLines = lines.map((current, li) => {
        if (li !== lineIdx) return current;
        const newTokens = [...current];
        newTokens.splice(tokenIdx, 2, merged);
        return newTokens;
      });
      onTokensChange?.(newLines);

      lookupLocalReading(merged.surface_form)
        .then((reading) => {
          if (!reading) return;
          const katakana = hiraganaToKatakana(reading);
          if (katakana === merged.reading) return;
          onTokensChange?.(applyTokenReading(newLines, lineIdx, merged, katakana));
        })
        .catch(() => {
          // Keep the concatenated reading if the local dictionary is unavailable.
        });
    },
    [lines, onTokensChange]
  );

  const handleSplit = useCallback(
    (lineIdx: number, tokenIdx: number, splitAt: number) => {
      const newLines = lines.map((line, li) => {
        if (li !== lineIdx) return line;
        const token = line[tokenIdx];
        const halves = splitTokenAt(token, splitAt);
        if (!halves) return line;

        const newTokens = [...line];
        newTokens.splice(tokenIdx, 1, ...halves);
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
                            setSelectedToken(
                              selectedToken?.token === token
                                ? null
                                : { token, line, lineIdx, tokenIdx }
                            );
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
          token={selectedToken.token}
          onClose={() => setSelectedToken(null)}
          readingMode={readingMode}
          onAddToAnki={onAddToAnki}
        />
      )}
    </div>
  );
};

export const LyricDisplay = React.memo(LyricDisplayComponent);
