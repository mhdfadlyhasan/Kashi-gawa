# （ﾑ）責任集合体

# Kashi-gawa (歌詞川)

Learn Japanese through song lyrics. No direct translations — just color-coded, tokenized lyrics where every word is a gateway to grammar and vocabulary.

## What is this?

Kashi-gawa (歌詞川, "Lyrics River") is a single-page web app for learning Japanese by reading song lyrics. Search for a song, get its lyrics, and explore every word interactively:

- **Color-coded tokens** show part of speech at a glance (nouns in blue, verbs in green, particles in yellow, adjectives in red, etc.)
- **Click any word** to see its reading, dictionary form, grammar explanation, and meaning.
- **Save songs** to a personal library so you can revisit them anytime.

The philosophy is simple: learn Japanese by reading Japanese, not by reading translations.

## Features

- 🔍 **Song Search** — Search for songs via [LRCLIB](https://lrclib.net/)
- 🎵 **Saved Library** — Keep a personal collection of songs in `localStorage`
- 🎨 **Color-coded Tokenization** — Japanese lyrics are tokenized with [Kuromoji.js](https://github.com/takuyaa/kuromoji.js) and colored by part of speech
- 💬 **Interactive Breakdown** — Click any word for grammar and dictionary details, shown as a popup or a compact sticky panel
- 📖 **Local Dictionary** — Built-in JMDict (common words) + Core 1000, with JLPT Vocab API and Wiktionary fallbacks
- 🈳 **Reading Modes** — Toggle between normal, hiragana, katakana, furigana, and romaji
- ✂️ **Edit Mode** — Manually merge or split tokens when Kuromoji gets a word wrong, then re-parse if needed
- 🎤 **Karaoke Mode** — Synced lyrics with optional YouTube playback, word highlighting, and timing offsets
- 🃏 **Anki Export** — Queue words with furigana, meaning, lyric context, translation, and notes, then export a `.apkg` (recommended) or CSV deck for a named deck
- 📱 **Responsive** — Single-page, mobile drawer sidebar, no backend, no routing
- 🔔 **Toast Notifications** — API and storage errors surface as non-blocking toasts

## Tech Stack

| Layer | Technology |
|-------|------------|
| Build Tool | Vite |
| Framework | React 19 (Functional Components + Hooks) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Tokenization | Kuromoji.js |
| Lyrics Source | LRCLIB API |
| Dictionary | JMDict common-only → Core 1000 → JLPT Vocab API → Wiktionary |
| Anki Export | `anki-apkg-export` + `sql.js` (WASM, generated in-browser) |
| Translation | DeepL (optional proxy) → MyMemory → Google Translate fallback |
| State & Persistence | React hooks + `localStorage` |
| Quality | ESLint + Prettier + Vitest |
| Deployment | GitHub Pages (GitHub Actions) |

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

```bash
git clone https://github.com/mhdfadlyhasan/Kashi-gawa.git
cd Kashi-gawa
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck and build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Run TypeScript with no emit |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the repo with Prettier |
| `npm run format:check` | Check formatting without writing |

## Project Structure

```
src/
  main.tsx                  # Entry point
  App.tsx                   # Root component, layout shell, song loading
  components/
    SearchBar.tsx           # LRCLIB search input + results dropdown
    SongLibrary.tsx         # Sidebar list of saved songs
    LyricDisplay.tsx        # Tokenized lyrics, merge/split editing
    WordToken.tsx           # Individual boxed/colored word
    BreakdownModal.tsx      # Popup breakdown: grammar, dict form, meaning, reading
    CompactBreakdown.tsx    # Inline sticky breakdown panel
    AnkiCardEditor.tsx      # Edit and translate a queued Anki card
    AnkiQueueModal.tsx      # Review queued cards, choose deck, export .apkg
    KaraokeBar.tsx          # Synced playback controls + optional YouTube player
    ReadingModeToggle.tsx   # Normal / hiragana / katakana / furigana / romaji
    DetailModeToggle.tsx    # Popup / compact breakdown mode
    WelcomeModal.tsx        # First-visit onboarding
    ToastContainer.tsx      # Renders toast notifications
  hooks/
    useLyrics.ts            # LRCLIB search + fetch-by-id state
    useLibrary.ts           # localStorage CRUD for the song library
    useTokenizer.ts         # Kuromoji init, tokenization, token merging
    useWordBreakdown.ts     # Dictionary + grammar lookup for a token
    useAnkiCards.ts         # Persisted Anki queue + deck name
    useReadingMode.ts       # Persisted reading mode
    useDetailMode.ts        # Persisted popup/compact detail mode
    useFirstVisit.ts        # Persisted welcome modal state
    useKaraokeClock.ts      # Virtual playback clock
    useYouTubePlayer.ts     # YouTube IFrame API wrapper
  lib/
    lrclib.ts               # LRCLIB API client
    jisho.ts                # Local dictionaries + JLPT/Wiktionary fallbacks
    core1000Dict.ts         # Bundled Core 1000 dictionary (generated)
    grammarDict.ts          # Suffix-based grammar explanations
    anki.ts                 # .apkg generation, ruby markup, share/download
    translate.ts            # Best-effort Japanese → English line translation
    karaoke.ts              # Timed line/token helpers
    lrc.ts                  # LRC parsing
    youtube.ts              # YouTube URL parsing + IFrame API loader
    kana.ts                 # Kana/romaji conversion + reading modes
    colorMap.ts             # Part-of-speech → color/label logic
    toast.ts                # Tiny toast event bus
  types/
    index.ts                # Shared TypeScript interfaces
    kuromoji-modules.d.ts   # Kuromoji loader type shim
  styles/
    index.css               # Tailwind directives + custom styles
public/
  dict/
    jmdict-common.json      # JMDict common-only dictionary (~22k words)
    *.dat.gz                # Kuromoji dictionary data
scripts/
  build-dict.ts             # Regenerates core1000Dict.ts from Jisho API
```

## Grammar Color Coding

Each word in the lyrics is wrapped in a box with a color based on its part of speech:

| Color | POS |
|-------|-----|
| 🔵 Blue | Noun, Pronoun, Proper Noun |
| 🟡 Yellow | Particle |
| 🟢 Green | Verb |
| 🔴 Red | I-adjective, Na-adjective |
| 🟣 Purple | Adverb |
| 🟠 Orange | Interjection |
| 🩷 Pink | Adnominal (連体詞) |
| ⚪ Gray | Everything else |

## How Word Lookup Works

When you click a token, the app (in order):

1. Looks up the token's dictionary form in JMDict common-only.
2. Falls back to the bundled Core 1000 dictionary.
3. Tries common deconjugations (potential, passive, causative) against the local dictionaries.
4. Falls back to the JLPT Vocab API.
5. Falls back to Wiktionary.

Grammar explanations come from `src/lib/grammarDict.ts`, matched by suffix.

## Data & Persistence

All data is stored client-side. There is no backend and no account.

`localStorage` keys:

| Key | Purpose |
|-----|---------|
| `kashi-gawa-library` | Saved songs and their tokens |
| `kashi-gawa-reading-mode` | Last reading mode |
| `kashi-gawa-detail-mode` | Last breakdown display mode |
| `kashi-gawa-welcome-shown` | Whether the welcome modal was dismissed |
| `kashi-gawa-anki-cards` | Queued cards waiting for export |
| `kashi-gawa-anki-deck` | Last Anki deck name |
| `kashi-gawa-anki-format` | Last export format (`.apkg` or `.csv`) |

```ts
interface LibraryItem {
  id: number;
  title: string;
  artist: string;
  plainLyrics: string;
  addedAt: string; // ISO 8601
  tokens: Token[][] | null;
  titleReading?: string;
  artistReading?: string;
}
```

## Anki Export

Click a word, choose **Add to Anki**, then review the card fields: term (dictionary form), term + furigana, meaning, the lyric sentence (with furigana over each kanji and the word highlighted), a machine-translated sentence meaning, and free-form notes. The sentence field also ends with a source line:

```
[sentence]

- song name + singer
```

The **Anki** button in the header opens the queue, where you can select cards, set the target deck name, choose a file type, edit or delete cards, and **Export**. Files are built in the browser before you click Export, so mobile share sheets open reliably.

Export formats:

- **Anki package (`.apkg`) — recommended.** Works with AnkiDroid, AnkiMobile, and desktop Anki.
- **CSV (`.csv`) — desktop Anki.** Useful for spreadsheets or manual field mapping. If your mobile app does not offer to import text files, use `.apkg`.

How to import (never unzip the `.apkg` — it is a ZIP container):

- **Android / AnkiDroid:** tap the downloaded `.apkg` → AnkiDroid → Add. If an archive app opens instead, open AnkiDroid → ⋮ → Import → select the file.
- **iPhone / AnkiMobile:** save to Files → tap the `.apkg` → AnkiMobile → Import.
- **Desktop Anki:** File → Import → select the `.apkg`.
- **CSV:** desktop Anki → File → Import → enable “Allow HTML” → map the six columns.

Notes:

- The note type is `Kashi-gawa Vocabulary` with six fields, so the same deck can be re-imported without duplicating cards.
- Exported card IDs are stable, so editing a queued card and re-exporting updates the existing note.
- Sentence meanings use DeepL when a proxy is configured, then MyMemory, then Google Translate. Lyrics are sent to those services only when you open the card editor; the field stays editable if translation fails.

### Enabling DeepL (optional)

DeepL's API does not allow direct browser requests (no CORS) and keys must stay secret, so the app talks to a tiny proxy instead. `workers/deepl-proxy.js` is a Cloudflare Worker that holds the key.

1. Create a Cloudflare Worker and paste in `workers/deepl-proxy.js`.
2. Add a secret `DEEPL_API_KEY` (free keys end in `:fx`).
3. Optionally set `ALLOWED_ORIGIN` to your deployed site (for example `https://<user>.github.io`) to stop others using your proxy.
4. Deploy, then either:
   - set the GitHub Actions repository variable `DEEPL_PROXY_URL` to the Worker URL (the deploy workflow passes it as `VITE_DEEPL_PROXY_URL`), or
   - build locally with `VITE_DEEPL_PROXY_URL=https://<worker>.workers.dev npm run build`, or
   - for a quick runtime override, run this in the browser console:
     ```js
     localStorage.setItem('kashi-gawa-deepl-proxy', 'https://<worker>.workers.dev');
     ```

Without a proxy URL the app silently falls back to MyMemory and Google Translate.

## Deployment

This project is configured for GitHub Pages. Pushing to `main` triggers `.github/workflows/deploy.yml`, which installs, lints, typechecks, builds, and deploys `dist/`.

`.github/workflows/ci.yml` runs lint, typecheck, format check, and build on pull requests and non-`main` branches.

## Known Gaps

- Unit tests cover the pure helpers, but UI and AnkiMobile import are verified manually.
- No error boundary; unexpected render errors can blank the page.
- The Kuromoji + JMDict assets are large (~19 MB total) and load on first use. The Anki exporter's WASM (~690 kB) loads only when you export.
- `localStorage` data has no schema version or quota handling.
- The Anki queue has no per-card deck override; the deck name applies to the whole export.

## License

MIT — see [LICENSE](LICENSE).
