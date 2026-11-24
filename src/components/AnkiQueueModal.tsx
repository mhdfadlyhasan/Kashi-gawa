import React, { useEffect, useMemo, useState } from 'react';
import { AnkiCard, AnkiExportFormat } from '../types';
import { DEFAULT_ANKI_DECK } from '../hooks/useAnkiCards';
import { buildApkg, buildCsv, csvFileName, deckFileName, shareOrDownloadFile } from '../lib/anki';
import { showToast } from '../lib/toast';

interface AnkiQueueModalProps {
  cards: AnkiCard[];
  deckName: string;
  format: AnkiExportFormat;
  onDeckNameChange: (name: string) => void;
  onFormatChange: (format: AnkiExportFormat) => void;
  onEdit: (card: AnkiCard) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

interface PreparedExport {
  key: string;
  blob: Blob;
  filename: string;
  mime: string;
}

export const AnkiQueueModal: React.FC<AnkiQueueModalProps> = ({
  cards,
  deckName,
  format,
  onDeckNameChange,
  onFormatChange,
  onEdit,
  onRemove,
  onClear,
  onClose,
}) => {
  const [deselected, setDeselected] = useState<Set<string>>(new Set());
  const [prepared, setPrepared] = useState<PreparedExport | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const selectedCards = useMemo(
    () => cards.filter((card) => !deselected.has(card.id)),
    [cards, deselected]
  );

  const deck = deckName.trim() || DEFAULT_ANKI_DECK;
  const prepareKey = useMemo(
    () => JSON.stringify({ ids: selectedCards.map((card) => card.id), deck, format }),
    [selectedCards, deck, format]
  );

  useEffect(() => {
    if (selectedCards.length === 0) {
      setPrepared(null);
      setIsPreparing(false);
      return;
    }

    let cancelled = false;
    setIsPreparing(true);

    const timer = setTimeout(async () => {
      try {
        const blob =
          format === 'apkg' ? await buildApkg(selectedCards, deck) : buildCsv(selectedCards);
        if (cancelled) return;
        setPrepared({
          key: prepareKey,
          blob,
          filename: format === 'apkg' ? deckFileName(deck) : csvFileName(deck),
          mime: format === 'apkg' ? 'application/apkg' : 'text/csv;charset=utf-8',
        });
      } catch (err) {
        if (cancelled) return;
        setPrepared(null);
        const message = err instanceof Error ? err.message : 'Unknown error';
        showToast(`Could not prepare the export — ${message}`);
      } finally {
        if (!cancelled) setIsPreparing(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedCards, deck, format, prepareKey]);

  const isReady = Boolean(prepared && prepared.key === prepareKey && !isPreparing);

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

  const handleExport = () => {
    if (!prepared || prepared.key !== prepareKey) return;

    void shareOrDownloadFile(prepared.blob, prepared.filename, prepared.mime).then(
      (delivery) => {
        if (delivery === 'shared') {
          showToast(
            format === 'apkg'
              ? 'Deck shared — choose Anki to import it'
              : 'CSV shared — import it in Anki Desktop'
          );
        } else if (delivery === 'downloaded') {
          showToast(
            format === 'apkg'
              ? 'Deck downloaded — open the .apkg in Anki (do not unzip)'
              : 'CSV downloaded — import it in Anki Desktop'
          );
        }
      },
      (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        showToast(`Export failed — ${message}`);
      }
    );
  };

  const handleClear = () => {
    if (cards.length === 0) return;
    const confirmed = window.confirm('Remove all queued Anki cards?');
    if (!confirmed) return;
    setDeselected(new Set());
    onClear();
  };

  const statusText =
    selectedCards.length === 0
      ? 'Select at least one card.'
      : isPreparing
        ? `Preparing ${format === 'apkg' ? '.apkg' : '.csv'}…`
        : isReady
          ? format === 'apkg'
            ? 'Ready. Open the .apkg in Anki — do not unzip it.'
            : 'Ready for Anki Desktop.'
          : 'Preparing…';

  return (
    <div className="fixed inset-0 z-[60] bg-black/30 overflow-y-auto" onClick={onClose}>
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

            <div className="mt-3">
              <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                File type
              </span>
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
                <button
                  type="button"
                  onClick={() => onFormatChange('apkg')}
                  aria-pressed={format === 'apkg'}
                  className={`px-3 py-1.5 text-xs rounded-md transition ${
                    format === 'apkg' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Anki package (.apkg)
                </button>
                <button
                  type="button"
                  onClick={() => onFormatChange('csv')}
                  aria-pressed={format === 'csv'}
                  className={`px-3 py-1.5 text-xs rounded-md transition ${
                    format === 'csv' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  CSV (desktop)
                </button>
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                {format === 'apkg'
                  ? 'Recommended for AnkiDroid, AnkiMobile, and desktop Anki.'
                  : 'Best for desktop Anki and spreadsheets. If your mobile app does not offer to import it, use .apkg.'}
              </p>
            </div>

            <details className="mt-3 text-[11px] text-gray-500">
              <summary className="cursor-pointer select-none text-gray-600 hover:text-gray-800">
                How to import (do not unzip the .apkg)
              </summary>
              <div className="mt-2 space-y-1 rounded-lg bg-gray-50 p-3">
                <p>
                  <span className="font-semibold text-gray-700">Android / AnkiDroid:</span> tap the
                  downloaded .apkg → AnkiDroid → Add. If an archive app opens instead, open
                  AnkiDroid → ⋮ → Import → select the file.
                </p>
                <p>
                  <span className="font-semibold text-gray-700">iPhone / AnkiMobile:</span> save to
                  Files → tap the .apkg → AnkiMobile → Import.
                </p>
                <p>
                  <span className="font-semibold text-gray-700">Desktop Anki:</span> File → Import →
                  select the .apkg.
                </p>
                <p>
                  <span className="font-semibold text-gray-700">CSV:</span> desktop Anki → File →
                  Import → enable “Allow HTML” → map the six columns.
                </p>
              </div>
            </details>

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
            <p className="text-[11px] text-gray-400">{statusText}</p>
            <button
              onClick={handleExport}
              disabled={!isReady || selectedCards.length === 0}
              className="flex-shrink-0 px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPreparing
                ? 'Preparing…'
                : `Export ${selectedCards.length || ''} ${format === 'apkg' ? 'to Anki' : 'as CSV'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
