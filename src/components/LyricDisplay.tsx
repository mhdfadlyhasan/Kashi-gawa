import React, { useState } from 'react';
import { Token } from '../types';
import { WordToken } from './WordToken';
import { BreakdownModal } from './BreakdownModal';

interface LyricDisplayProps {
  lines: Token[][];
}

export const LyricDisplay: React.FC<LyricDisplayProps> = ({ lines }) => {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  return (
    <div className="space-y-4 leading-loose">
      {lines.map((line, lineIdx) => (
        <div key={lineIdx} className="flex flex-wrap gap-1">
          {line.map((token, tokenIdx) => (
            <WordToken
              key={`${lineIdx}-${tokenIdx}`}
              token={token}
              onClick={() => setSelectedToken(token)}
            />
          ))}
        </div>
      ))}

      {selectedToken && (
        <BreakdownModal
          token={selectedToken}
          onClose={() => setSelectedToken(null)}
        />
      )}
    </div>
  );
};
