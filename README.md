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
- 💬 **Interactive Breakdown** — Click any word for grammar and dictionary details
- 📖 **Local Dictionary** — Built-in JMDict (common words) + Core 1000 + JLPT Vocab API fallback
- 📱 **Simple & Fast** — Single-page, no backend, no routing, built with Vite

## Tech Stack

| Layer | Technology |
|-------|------------|
| Build Tool | Vite |
| Framework | React 19 (Functional Components + Hooks) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Tokenization | Kuromoji.js |
| Lyrics Source | LRCLIB API |
| Dictionary | JMDict + Core 1000 + JLPT Vocab API |

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/Kashi-gawa.git
cd Kashi-gawa

# Install dependencies
npm install

# Run the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

The static files will be output to the `dist/` directory, ready for deployment.

## Project Structure

```
src/
  main.tsx                  # Entry point
  App.tsx                     # Root component, layout shell
  components/
    SearchBar.tsx             # Song search input + LRCLIB search results
    SongLibrary.tsx           # Sidebar list of saved songs
    LyricDisplay.tsx          # Main area: renders tokenized lyrics
    WordToken.tsx             # Individual boxed/colored word
    BreakdownModal.tsx        # Click popup: grammar, dict form, meaning, reading
  hooks/
    useLyrics.ts              # LRCLIB fetch + caching logic
    useLibrary.ts             # localStorage CRUD for the song library
    useTokenizer.ts           # Kuromoji.js init & tokenization
  lib/
    lrclib.ts                 # LRCLIB API client
    jisho.ts                  # Dictionary lookup (local + API fallback)
    core1000Dict.ts           # Bundled Core 1000 dictionary
    colorMap.ts               # Part-of-Speech → color logic
    grammarDict.ts            # Local conjugation/grammar explanations
  types/
    index.ts                  # All TypeScript interfaces
  styles/
    index.css                 # Tailwind directives + custom styles
public/
  dict/
    jmdict-common.json      # JMDict common-only dictionary (~22k words)
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

## Deployment

This project is configured for GitHub Pages. The deployment is handled automatically by a GitHub Actions workflow (`.github/workflows/deploy.yml`) on every push to `main`.

To deploy manually, make sure `vite.config.ts` has the correct `base` path for your repository, then push to `main`.

## License

MIT
