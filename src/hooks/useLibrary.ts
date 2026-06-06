import { useState, useEffect, useCallback } from 'react';
import { showToast } from '../lib/toast';
import { LibraryItem, Token } from '../types';

const STORAGE_KEY = 'kashi-gawa-library';

function loadLibrary(): LibraryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LibraryItem[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    showToast(`Failed to load library — ${message}`);
    return [];
  }
}

function saveLibrary(items: LibraryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    showToast(`Failed to save library — ${message}`);
  }
}

export function useLibrary() {
  const [library, setLibrary] = useState<LibraryItem[]>(loadLibrary);

  useEffect(() => {
    saveLibrary(library);
  }, [library]);

  const addSong = useCallback((item: Omit<LibraryItem, 'addedAt' | 'tokens'>) => {
    setLibrary((prev) => {
      const exists = prev.find((s) => s.id === item.id);
      if (exists) return prev;
      const newItem: LibraryItem = {
        ...item,
        addedAt: new Date().toISOString(),
        tokens: null,
      };
      return [newItem, ...prev];
    });
  }, []);

  const removeSong = useCallback((id: number) => {
    setLibrary((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateTokens = useCallback((id: number, tokens: Token[][]) => {
    setLibrary((prev) =>
      prev.map((s) => (s.id === id ? { ...s, tokens } : s))
    );
  }, []);

  const updateReadings = useCallback((id: number, titleReading: string, artistReading: string) => {
    setLibrary((prev) =>
      prev.map((s) => (s.id === id ? { ...s, titleReading, artistReading } : s))
    );
  }, []);

  const getSong = useCallback(
    (id: number) => library.find((s) => s.id === id) || null,
    [library]
  );

  return {
    library,
    addSong,
    removeSong,
    updateTokens,
    updateReadings,
    getSong,
  };
}
