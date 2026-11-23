import { AnkiCard } from '../types';
import { katakanaToHiragana } from './kana';

const MODEL_NAME = 'Kashi-gawa Vocabulary';
const FIELD_NAMES = ['Term', 'TermFurigana', 'Meaning', 'Sentence', 'SentenceMeaning', 'Notes'];

const CARD_CSS = `
.card {
  font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif;
  font-size: 22px;
  line-height: 1.6;
  text-align: center;
  color: #1f2937;
  background: #f9fafb;
  padding: 16px;
}
ruby rt {
  font-size: 0.5em;
  color: #6b7280;
}
.term {
  font-size: 88px;
  line-height: 1.2;
}
.meaning {
  font-size: 1.15em;
  font-weight: 600;
}
.sentence {
  margin-top: 16px;
  font-size: 2em;
}
.sentence-meaning {
  margin-top: 8px;
  color: #4b5563;
}
.notes {
  margin-top: 16px;
  font-size: 0.85em;
  color: #6b7280;
}
hr#answer {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 16px 0;
}
.nightMode .card,
.card.nightMode {
  color: #e5e7eb;
  background: #1f2937;
}
.nightMode ruby rt,
.card.nightMode ruby rt {
  color: #9ca3af;
}
.nightMode .sentence-meaning,
.card.nightMode .sentence-meaning,
.nightMode .notes,
.card.nightMode .notes {
  color: #9ca3af;
}
`.trim();

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const KANJI_RE = /[\u3005\u3007\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

interface SurfaceRun {
  text: string;
  kanji: boolean;
}

function splitRuns(surface: string): SurfaceRun[] {
  const runs: SurfaceRun[] = [];
  for (const char of surface) {
    const kanji = KANJI_RE.test(char);
    const last = runs[runs.length - 1];
    if (last && last.kanji === kanji) last.text += char;
    else runs.push({ text: char, kanji });
  }
  return runs;
}

export function toFurigana(term: string, reading: string): string {
  const surface = term.trim();
  const kana = katakanaToHiragana(reading.trim());
  if (!surface) return '';
  if (!KANJI_RE.test(surface) || !kana || kana === surface) return escapeHtml(surface);

  const runs = splitRuns(surface);
  let readingIndex = 0;
  let html = '';

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];

    if (!run.kanji) {
      for (const char of run.text) {
        if (readingIndex < kana.length && kana[readingIndex] === char) readingIndex += 1;
      }
      html += escapeHtml(run.text);
      continue;
    }

    const next = runs[i + 1];
    let end = kana.length;
    if (next && !next.kanji) {
      const isLastRun = i + 2 === runs.length;
      if (isLastRun && kana.endsWith(next.text) && kana.length - next.text.length >= readingIndex) {
        end = kana.length - next.text.length;
      } else {
        const found = kana.indexOf(next.text, readingIndex);
        if (found !== -1) end = found;
      }
    }

    const part = kana.slice(readingIndex, end);
    readingIndex = end;
    html += part
      ? `<ruby>${escapeHtml(run.text)}<rt>${escapeHtml(part)}</rt></ruby>`
      : escapeHtml(run.text);
  }

  return html;
}

export function tokensToSentenceHtml(
  tokens: { surface: string; reading: string }[],
  boldIndex = -1
): string {
  return tokens
    .map((token, index) => {
      const html = toFurigana(token.surface, token.reading);
      return index === boldIndex ? `<b>${html}</b>` : html;
    })
    .join('');
}

function sourceLine(sourceTitle: string, sourceArtist: string): string {
  const source = [sourceTitle.trim(), sourceArtist.trim()].filter(Boolean).join(' + ');
  return source ? `<br><br>- ${escapeHtml(source)}` : '';
}

function highlightSentenceBody(sentence: string, surface: string): string {
  const safeSentence = escapeHtml(sentence);
  const needle = escapeHtml(surface.trim());
  const index = needle ? safeSentence.indexOf(needle) : -1;
  if (index === -1) return safeSentence;
  return `${safeSentence.slice(0, index)}<b>${needle}</b>${safeSentence.slice(index + needle.length)}`;
}

export function sentenceToHtml(
  sentence: string,
  surface: string,
  sourceTitle = '',
  sourceArtist = ''
): string {
  return highlightSentenceBody(sentence, surface) + sourceLine(sourceTitle, sourceArtist);
}

export function buildSentenceField(card: AnkiCard): string {
  const body =
    card.sentenceFurigana?.trim() ||
    highlightSentenceBody(card.sentence, card.surface || card.term);
  return isCustomSentence(card) ? body : body + sourceLine(card.sourceTitle, card.sourceArtist);
}

function withLineBreaks(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

export function isCustomSentence(card: AnkiCard): boolean {
  if (!card.sourceSentence) return false;
  return card.sentence.trim() !== card.sourceSentence.trim();
}

export function findHighlightIndex(
  tokens: { surface: string; basicForm: string }[],
  surface: string,
  term: string
): number {
  const targets = [surface.trim(), term.trim()].filter(Boolean);
  for (const target of targets) {
    const index = tokens.findIndex((token) => token.surface === target);
    if (index !== -1) return index;
  }
  for (const target of targets) {
    const index = tokens.findIndex((token) => token.basicForm === target);
    if (index !== -1) return index;
  }
  return -1;
}

export function buildSentenceMeaningField(card: AnkiCard): string {
  return withLineBreaks(card.sentenceMeaning);
}

function sanitizeTag(value: string): string {
  return value.trim().replace(/\s+/g, '_');
}

export async function buildApkg(cards: AnkiCard[], deckName: string): Promise<Blob> {
  if (cards.length === 0) throw new Error('No cards selected');

  const [{ default: AnkiExport }, { default: initSqlJs }, wasm] = await Promise.all([
    import('anki-apkg-export'),
    import('sql.js'),
    import('sql.js/dist/sql-wasm-browser.wasm?url'),
  ]);

  const sql = await initSqlJs({ locateFile: () => wasm.default, useOldExtensionFunctions: true });
  const apkg = await AnkiExport.create(deckName, { sql });

  try {
    const modelId = apkg.addModel({
      name: MODEL_NAME,
      fields: FIELD_NAMES,
      sortField: 'Term',
      css: CARD_CSS,
      templates: [
        {
          name: 'Recognition',
          questionFormat: '<div class="term">{{TermFurigana}}</div>',
          answerFormat:
            '<div class="term">{{TermFurigana}}</div>' +
            '<hr id="answer">' +
            '<div class="meaning">{{Meaning}}</div>' +
            '<div class="sentence">{{Sentence}}</div>' +
            '<div class="sentence-meaning">{{SentenceMeaning}}</div>' +
            '{{#Notes}}<div class="notes">{{Notes}}</div>{{/Notes}}',
          requiredFields: ['Term'],
        },
      ],
    });

    apkg.addNotes(
      cards.map((card) => ({
        fields: {
          Term: escapeHtml(card.term),
          TermFurigana: toFurigana(card.term, card.reading),
          Meaning: withLineBreaks(card.meaning),
          Sentence: buildSentenceField(card),
          SentenceMeaning: buildSentenceMeaningField(card),
          Notes: withLineBreaks(card.notes),
        },
        noteId: card.id,
        tags: ['kashi-gawa', sanitizeTag(card.sourceArtist)].filter(Boolean),
        deck: deckName,
        modelId,
      }))
    );

    return await apkg.save({ type: 'blob' });
  } finally {
    apkg.close();
  }
}

const CSV_HEADERS = ['Term', 'TermFurigana', 'Meaning', 'Sentence', 'SentenceMeaning', 'Notes'];

function csvEscape(value: string): string {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildCsv(cards: AnkiCard[]): Blob {
  if (cards.length === 0) throw new Error('No cards selected');

  const rows = [
    CSV_HEADERS,
    ...cards.map((card) => [
      escapeHtml(card.term),
      toFurigana(card.term, card.reading),
      withLineBreaks(card.meaning),
      buildSentenceField(card),
      buildSentenceMeaningField(card),
      withLineBreaks(card.notes),
    ]),
  ];

  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
  return new Blob([csv], { type: 'text/csv;charset=utf-8' });
}

function deckSlug(deckName: string): string {
  return (
    deckName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'kashi-gawa'
  );
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function deckFileName(deckName: string): string {
  return `${deckSlug(deckName)}-${dateStamp()}.apkg`;
}

export function csvFileName(deckName: string): string {
  return `${deckSlug(deckName)}-${dateStamp()}.csv`;
}

export type ExportDelivery = 'shared' | 'downloaded' | 'cancelled';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function shareOrDownloadFile(
  blob: Blob,
  filename: string,
  mime = 'application/octet-stream'
): Promise<ExportDelivery> {
  const file = new File([blob], filename, { type: mime });
  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };

  if (isMobileDevice() && typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
    return nav.share({ files: [file], title: 'Kashi-gawa deck' }).then(
      () => 'shared' as const,
      (err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled' as const;
        downloadBlob(file, filename);
        return 'downloaded' as const;
      }
    );
  }

  downloadBlob(file, filename);
  return Promise.resolve('downloaded');
}
