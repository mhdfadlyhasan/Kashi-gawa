import { useCallback, useEffect, useState } from 'react';
import { AnkiCard, AnkiExportFormat } from '../types';
import { showToast } from '../lib/toast';

const CARDS_KEY = 'kashi-gawa-anki-cards';
const DECK_KEY = 'kashi-gawa-anki-deck';
const FORMAT_KEY = 'kashi-gawa-anki-format';

export const DEFAULT_ANKI_DECK = 'Kashi-gawa';

function loadCards(): AnkiCard[] {
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AnkiCard[]) : [];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    showToast(`Failed to load Anki cards — ${message}`);
    return [];
  }
}

function loadDeckName(): string {
  try {
    return localStorage.getItem(DECK_KEY)?.trim() || DEFAULT_ANKI_DECK;
  } catch {
    return DEFAULT_ANKI_DECK;
  }
}

function loadFormat(): AnkiExportFormat {
  try {
    return localStorage.getItem(FORMAT_KEY) === 'csv' ? 'csv' : 'apkg';
  } catch {
    return 'apkg';
  }
}

export function useAnkiCards() {
  const [cards, setCards] = useState<AnkiCard[]>(loadCards);
  const [deckName, setDeckName] = useState<string>(loadDeckName);
  const [exportFormat, setExportFormat] = useState<AnkiExportFormat>(loadFormat);

  useEffect(() => {
    try {
      localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      showToast(`Failed to save Anki cards — ${message}`);
    }
  }, [cards]);

  useEffect(() => {
    try {
      localStorage.setItem(DECK_KEY, deckName.trim() || DEFAULT_ANKI_DECK);
    } catch {
      // Persisting the deck name is best-effort.
    }
  }, [deckName]);

  useEffect(() => {
    try {
      localStorage.setItem(FORMAT_KEY, exportFormat);
    } catch {
      // Persisting the export format is best-effort.
    }
  }, [exportFormat]);

  const saveCard = useCallback((card: AnkiCard) => {
    setCards((prev) => {
      const index = prev.findIndex((item) => item.id === card.id);
      if (index === -1) return [card, ...prev];
      const next = [...prev];
      next[index] = card;
      return next;
    });
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
  }, []);

  const clearCards = useCallback(() => {
    setCards([]);
  }, []);

  const getCard = useCallback(
    (id: string) => cards.find((card) => card.id === id) ?? null,
    [cards]
  );

  return {
    cards,
    deckName,
    setDeckName,
    exportFormat,
    setExportFormat,
    saveCard,
    removeCard,
    clearCards,
    getCard,
  };
}
