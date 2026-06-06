import React from 'react';
import { ReadingMode } from '../lib/kana';

interface ReadingModeToggleProps {
  readingMode: ReadingMode;
  onChange: (mode: ReadingMode) => void;
}

export const ReadingModeToggle: React.FC<ReadingModeToggleProps> = ({
  readingMode,
  onChange,
}) => {
  const modes: { value: ReadingMode; label: string }[] = [
    { value: 'normal', label: '通常' },
    { value: 'hiragana', label: 'ひらがな' },
    { value: 'katakana', label: 'カタカナ' },
    { value: 'romaji', label: 'romaji' },
  ];

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 w-full">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onChange(mode.value)}
          className={`flex-1 px-2 py-1 md:px-3 text-xs md:text-sm rounded-md transition whitespace-nowrap ${
            readingMode === mode.value
              ? 'bg-white text-gray-900 shadow-sm font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
};
