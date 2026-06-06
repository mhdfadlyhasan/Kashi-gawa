import { useState, useEffect } from 'react';

export type DetailMode = 'popup' | 'compact';

const STORAGE_KEY = 'kashi-gawa-detail-mode';

export function useDetailMode(): {
  detailMode: DetailMode;
  setDetailMode: (mode: DetailMode) => void;
} {
  const [detailMode, setDetailMode] = useState<DetailMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'popup' || stored === 'compact') return stored;
    return 'popup';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, detailMode);
  }, [detailMode]);

  return { detailMode, setDetailMode };
}
