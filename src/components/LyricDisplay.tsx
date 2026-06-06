import React, { useState } from 'react';
import { Token } from '../types';
import { ReadingMode } from '../lib/kana';
import { WordToken } from './WordToken';
import { BreakdownModal } from './BreakdownModal';

interface LyricDisplayProps {
  lines: Token[][];
  readingMode: ReadingMode;
}

export const LyricDisplay: React.FC<LyricDisplayProps> = ({ lines, readingMode }) => {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  return (
    <div className="space-y-4 leading-loose">
      {lines.map((line, lineIdx) => {
        const meaningful = line.filter(
          (t) =>
            t.surface_form &&
            t.surface_form.trim() !== '' &&
            t.pos !== '記号' &&
            !/^[\s\p{P}\p{S}]+$/u.test(t.surface_form)
        );
        return (
          <div key={lineIdx} className="flex flex-wrap gap-1">
            {meaningful.map((token, tokenIdx) => (
              <WordToken
                key={`${lineIdx}-${tokenIdx}`}
                token={token}
                onClick={() => setSelectedToken(token)}
                readingMode={readingMode}
              />
            ))}
          </div>
        );
      })}

      {selectedToken && (
        <BreakdownModal
          token={selectedToken}
          onClose={() => setSelectedToken(null)}
          readingMode={readingMode}
        />
      )}
    </div>
  );
};
