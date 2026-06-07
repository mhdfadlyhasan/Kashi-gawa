import React, { useState, useRef, useEffect } from 'react';
import { ReadingMode } from '../lib/kana';

interface ReadingModeToggleProps {
  readingMode: ReadingMode;
  onChange: (mode: ReadingMode) => void;
}

export const ReadingModeToggle: React.FC<ReadingModeToggleProps> = ({
  readingMode,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const modes: { value: ReadingMode; label: string }[] = [
    { value: 'normal', label: '通常' },
    { value: 'hiragana', label: 'ひらがな' },
    { value: 'katakana', label: 'カタカナ' },
    { value: 'furigana', label: 'furigana' },
    { value: 'romaji', label: 'romaji' },
  ];

  const active = modes.find((m) => m.value === readingMode) || modes[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full inline-flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-50 transition shadow-sm"
      >
        <span className="font-medium">{active.label}</span>
        <svg
          className={`w-4 h-4 text-gray-400 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => {
                onChange(mode.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition hover:bg-gray-50 ${
                readingMode === mode.value
                  ? 'bg-gray-50 text-gray-900 font-medium'
                  : 'text-gray-600'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
