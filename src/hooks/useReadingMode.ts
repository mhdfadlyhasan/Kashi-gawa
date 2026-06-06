import { useState, useEffect } from 'react';
import { ReadingMode } from '../lib/kana';

export function useReadingMode() {
  const [readingMode, setReadingMode] = useState<ReadingMode>(() => {
    const saved = localStorage.getItem('kashi-gawa-reading-mode');
    return (saved as ReadingMode) || 'normal';
  });

  useEffect(() => {
    localStorage.setItem('kashi-gawa-reading-mode', readingMode);
  }, [readingMode]);

  return { readingMode, setReadingMode };
}
