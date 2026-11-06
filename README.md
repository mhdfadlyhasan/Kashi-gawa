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
| State & Persistence | React hooks + `localStorage` |
| Quality | ESLint + Prettier (tests not set up yet) |
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
    ReadingModeToggle.tsx   # Normal / hiragana / katakana / furigana / romaji
    DetailModeToggle.tsx    # Popup / compact breakdown mode
    WelcomeModal.tsx        # First-visit onboarding
    ToastContainer.tsx      # Renders toast notifications
  hooks/
    useLyrics.ts            # LRCLIB search + fetch-by-id state
    useLibrary.ts           # localStorage CRUD for the song library
    useTokenizer.ts         # Kuromoji init, tokenization, token merging
    useWordBreakdown.ts     # Dictionary + grammar lookup for a token
    useReadingMode.ts       # Persisted reading mode
    useDetailMode.ts        # Persisted popup/compact detail mode
    useFirstVisit.ts        # Persisted welcome modal state
  lib/
    lrclib.ts               # LRCLIB API client
    jisho.ts                # Local dictionaries + JLPT/Wiktionary fallbacks
    core1000Dict.ts         # Bundled Core 1000 dictionary (generated)
    grammarDict.ts          # Suffix-based grammar explanations
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

## Deployment

This project is configured for GitHub Pages. Pushing to `main` triggers `.github/workflows/deploy.yml`, which installs, lints, typechecks, builds, and deploys `dist/`.

`.github/workflows/ci.yml` runs lint, typecheck, format check, and build on pull requests and non-`main` branches.

## Known Gaps

- No automated tests yet (Playwright is installed but not configured).
- No error boundary; unexpected render errors can blank the page.
- The Kuromoji + JMDict assets are large (~19 MB total) and load on first use.
- `localStorage` data has no schema version or quota handling.

## License

MIT — see [LICENSE](LICENSE).
