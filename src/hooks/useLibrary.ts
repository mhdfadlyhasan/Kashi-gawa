import { useState, useEffect, useCallback } from 'react';
import { LibraryItem, Token } from '../types';

const STORAGE_KEY = 'kashi-gawa-library';

function loadLibrary(): LibraryItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as LibraryItem[];
}

function saveLibrary(items: LibraryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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

  const getSong = useCallback(
    (id: number) => library.find((s) => s.id === id) || null,
    [library]
  );

  return {
    library,
    addSong,
    removeSong,
    updateTokens,
    getSong,
  };
}
