import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnkiCard } from '../types';
import { DEFAULT_ANKI_DECK } from '../hooks/useAnkiCards';
import { tokenizeText } from '../hooks/useTokenizer';
import { findHighlightIndex, tokensToSentenceHtml } from '../lib/anki';
import { translateJapanese } from '../lib/translate';
import { showToast } from '../lib/toast';

interface AnkiCardEditorProps {
  initial: AnkiCard;
  deckName: string;
  onDeckNameChange: (name: string) => void;
  onSave: (card: AnkiCard) => void;
  onClose: () => void;
}

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300';

export const AnkiCardEditor: React.FC<AnkiCardEditorProps> = ({
  initial,
  deckName,
  onDeckNameChange,
  onSave,
  onClose,
}) => {
  const [card, setCard] = useState<AnkiCard>(initial);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const lastTokenizedRef = useRef(
    initial.sentenceFurigana
      ? `${initial.sentence.trim()}||${initial.surface}||${initial.term}`
      : ''
  );
  const lastTranslatedRef = useRef(initial.sentenceMeaning.trim() ? initial.sentence.trim() : '');

  const update = useCallback(<K extends keyof AnkiCard>(key: K, value: AnkiCard[K]) => {
    setCard((prev) => ({ ...prev, [key]: value }));
  }, []);

  const buildSentenceFurigana = useCallback(
    async (text: string, surface: string, term: string): Promise<string> => {
      const trimmed = text.trim();
      if (!trimmed) return '';
      const tokens = await tokenizeText(trimmed);
      const mapped = tokens.map((token) => ({
        surface: token.surface_form,
        reading: token.reading || '',
        basicForm: token.basic_form,
      }));
      return tokensToSentenceHtml(mapped, findHighlightIndex(mapped, surface, term));
    },
    []
  );

  useEffect(() => {
    const trimmed = card.sentence.trim();
    const key = `${trimmed}||${card.surface}||${card.term}`;

    if (!trimmed) {
      lastTokenizedRef.current = key;
      setCard((prev) => (prev.sentenceFurigana ? { ...prev, sentenceFurigana: '' } : prev));
      return;
    }

    if (key === lastTokenizedRef.current && card.sentenceFurigana) return;

    const timer = setTimeout(() => {
      setIsTokenizing(true);
      buildSentenceFurigana(trimmed, card.surface, card.term)
        .then((html) => {
          lastTokenizedRef.current = key;
          setCard((prev) =>
            prev.sentence.trim() === trimmed ? { ...prev, sentenceFurigana: html } : prev
          );
        })
        .catch(() => {
          showToast('Could not analyze this sentence — furigana skipped');
        })
        .finally(() => setIsTokenizing(false));
    }, 5000);

    return () => clearTimeout(timer);
  }, [card.sentence, card.surface, card.term, card.sentenceFurigana, buildSentenceFurigana]);

  const translateSentence = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsTranslating(true);
    try {
      const result = await translateJapanese(trimmed);
      if (result) {
        lastTranslatedRef.current = trimmed;
        setCard((prev) => ({ ...prev, sentenceMeaning: result }));
      } else {
        showToast('Could not translate this sentence — you can type it in');
      }
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const translate = useCallback(() => {
    void translateSentence(card.sentence);
  }, [card.sentence, translateSentence]);

  const handleSentenceBlur = () => {
    const trimmed = card.sentence.trim();
    if (!trimmed || trimmed === lastTranslatedRef.current) return;
    void translateSentence(trimmed);
  };

  useEffect(() => {
    if (initial.sentenceMeaning.trim() || !initial.sentence.trim()) return;
    let cancelled = false;
    setIsTranslating(true);
    translateJapanese(initial.sentence)
      .then((result) => {
        if (!cancelled && result) {
          lastTranslatedRef.current = initial.sentence.trim();
          setCard((prev) =>
            prev.sentenceMeaning.trim() ? prev : { ...prev, sentenceMeaning: result }
          );
        }
      })
      .catch(() => {
        if (!cancelled) showToast('Could not translate this sentence — you can type it in');
      })
      .finally(() => {
        if (!cancelled) setIsTranslating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initial.sentence, initial.sentenceMeaning]);

  const handleSave = async () => {
    if (!card.term.trim()) {
      showToast('Term cannot be empty');
      return;
    }

    const trimmedSentence = card.sentence.trim();
    let sentenceFurigana = card.sentenceFurigana;
    if (trimmedSentence && !sentenceFurigana) {
      try {
        sentenceFurigana = await buildSentenceFurigana(trimmedSentence, card.surface, card.term);
      } catch {
        showToast('Could not analyze this sentence — furigana skipped');
      }
    }

    onSave({
      ...card,
      term: card.term.trim(),
      reading: card.reading.trim(),
      meaning: card.meaning.trim(),
      sentence: trimmedSentence,
      sourceSentence: card.sourceSentence ?? initial.sentence,
      sentenceFurigana,
      sentenceMeaning: card.sentenceMeaning.trim(),
      notes: card.notes.trim(),
    });
  };

  const sourceSentence = card.sourceSentence ?? initial.sentence;
  const isCustom = card.sentence.trim() !== sourceSentence.trim();

  return (
    <div className="fixed inset-0 z-[60] bg-black/30 overflow-y-auto" onClick={onClose}>
      <div className="min-h-screen flex items-start sm:items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Close"
          >
            ×
          </button>

          <div className="mb-5">
            <h3 className="text-lg font-bold text-gray-900">Add to Anki</h3>
            <label className="block mt-3">
              <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                Deck name
              </span>
              <input
                type="text"
                value={deckName}
                onChange={(e) => onDeckNameChange(e.target.value)}
                placeholder={DEFAULT_ANKI_DECK}
                className={inputClass}
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Term
                </span>
                <input
                  type="text"
                  value={card.term}
                  onChange={(e) => update('term', e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Reading (furigana)
                </span>
                <input
                  type="text"
                  value={card.reading}
                  onChange={(e) => update('reading', e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block">
              <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                Meaning
              </span>
              <textarea
                value={card.meaning}
                onChange={(e) => update('meaning', e.target.value)}
                rows={2}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                Sentence
              </span>
              <textarea
                value={card.sentence}
                onChange={(e) =>
                  setCard((prev) => ({ ...prev, sentence: e.target.value, sentenceFurigana: '' }))
                }
                onBlur={handleSentenceBlur}
                rows={2}
                className={inputClass}
              />
              {card.sentenceFurigana && (
                <div
                  className="mt-1 text-sm text-gray-600"
                  dangerouslySetInnerHTML={{ __html: card.sentenceFurigana }}
                />
              )}
              {isTokenizing && (
                <p className="mt-1 text-[11px] text-gray-400">Analyzing sentence…</p>
              )}
              {!isCustom && (card.sourceTitle.trim() || card.sourceArtist.trim()) && (
                <p className="mt-1 text-[11px] text-gray-400 truncate">
                  -{' '}
                  {[card.sourceTitle.trim(), card.sourceArtist.trim()].filter(Boolean).join(' + ')}
                </p>
              )}
            </label>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="block text-xs text-gray-500 uppercase tracking-wide">
                  Sentence meaning
                </span>
                <button
                  type="button"
                  onClick={translate}
                  disabled={isTranslating || !card.sentence.trim()}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTranslating ? 'Translating…' : 'Translate'}
                </button>
              </div>
              <textarea
                value={card.sentenceMeaning}
                onChange={(e) => update('sentenceMeaning', e.target.value)}
                rows={2}
                placeholder={isTranslating ? 'Translating…' : ''}
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Machine-translated when available (MyMemory / Google). Edit it freely.
              </p>
            </div>

            <label className="block">
              <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                Notes
              </span>
              <textarea
                value={card.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={2}
                placeholder="Grammar notes, mnemonics, …"
                className={inputClass}
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 mt-6">
            <div className="min-w-0 text-[11px] text-gray-400 truncate">
              {card.sourceTitle} · {card.sourceArtist}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Save card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
