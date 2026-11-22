import React, { useMemo, useState } from 'react';
import { AnkiCard } from '../types';
import { DEFAULT_ANKI_DECK } from '../hooks/useAnkiCards';
import { buildApkg, deckFileName, shareOrDownloadApkg } from '../lib/anki';
import { showToast } from '../lib/toast';

interface AnkiQueueModalProps {
  cards: AnkiCard[];
  deckName: string;
  onDeckNameChange: (name: string) => void;
  onEdit: (card: AnkiCard) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export const AnkiQueueModal: React.FC<AnkiQueueModalProps> = ({
  cards,
  deckName,
  onDeckNameChange,
  onEdit,
  onRemove,
  onClear,
  onClose,
}) => {
  const [deselected, setDeselected] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const selectedCards = useMemo(
    () => cards.filter((card) => !deselected.has(card.id)),
    [cards, deselected]
  );

  const toggle = (id: string) => {
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setDeselected(new Set());
  const selectNone = () => setDeselected(new Set(cards.map((card) => card.id)));

  const handleExport = async () => {
    if (selectedCards.length === 0) {
      showToast('Select at least one card to export');
      return;
    }

    const deck = deckName.trim() || DEFAULT_ANKI_DECK;
    setIsExporting(true);
    try {
      const blob = await buildApkg(selectedCards, deck);
      const delivery = await shareOrDownloadApkg(blob, deckFileName(deck));
      if (delivery === 'shared') {
        showToast('Deck shared — choose Anki to import it');
      } else if (delivery === 'downloaded') {
        showToast('Deck downloaded — open the .apkg in Anki');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      showToast(`Export failed — ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClear = () => {
    if (cards.length === 0) return;
    const confirmed = window.confirm('Remove all queued Anki cards?');
    if (!confirmed) return;
    setDeselected(new Set());
    onClear();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 overflow-y-auto" onClick={onClose}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Anki queue</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {cards.length} card{cards.length === 1 ? '' : 's'} · {selectedCards.length} selected
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="px-5 pt-4">
            <label className="block">
              <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                Deck name
              </span>
              <input
                type="text"
                value={deckName}
                onChange={(e) => onDeckNameChange(e.target.value)}
                placeholder={DEFAULT_ANKI_DECK}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </label>
            <div className="flex items-center gap-3 mt-3 text-xs">
              <button onClick={selectAll} className="text-blue-600 hover:text-blue-800">
                Select all
              </button>
              <button onClick={selectNone} className="text-blue-600 hover:text-blue-800">
                Select none
              </button>
              <button
                onClick={handleClear}
                disabled={cards.length === 0}
                className="ml-auto text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {cards.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-10">
                No cards yet. Click a word and choose “Add to Anki”.
              </div>
            ) : (
              cards.map((card) => {
                const checked = !deselected.has(card.id);
                return (
                  <div
                    key={card.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition ${
                      checked ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(card.id)}
                      className="mt-1 accent-gray-800"
                      aria-label={`Select ${card.term}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{card.term}</span>
                        {card.reading && (
                          <span className="text-xs text-gray-500">{card.reading}</span>
                        )}
                      </div>
                      {card.meaning && (
                        <div className="text-sm text-green-900 truncate">{card.meaning}</div>
                      )}
                      {card.sentence && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">{card.sentence}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onEdit(card)}
                        className="px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onRemove(card.id)}
                        className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-5 border-t border-gray-100 flex items-center justify-between gap-3">
            <p className="text-[11px] text-gray-400">
              Exports a .apkg file. Open it in AnkiMobile/AnkiDroid to import.
            </p>
            <button
              onClick={handleExport}
              disabled={isExporting || selectedCards.length === 0}
              className="flex-shrink-0 px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting…' : `Export ${selectedCards.length || ''} to Anki`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
