# AGENTS.md — Kashi-gawa

## Project Overview

Kashi-gawa (歌詞川, "Lyrics River") is a single-page web application for learning Japanese through song lyrics. Users search for songs, fetch Japanese lyrics, and interact with a color-coded, tokenized display where each word can be clicked for a grammar and vocabulary breakdown.

## Core Philosophy

- **No direct translation.** The goal is to learn Japanese, not to read translations.
- **Grammar through interaction.** Colors and click-to-reveal breakdowns teach patterns naturally.
- **Simplicity first.** This is a learning tool, not a production SaaS. No error handling, no backend.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Build Tool | Vite |
| Framework | React 19 (Functional Components + Hooks only) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Japanese Tokenization | Kuromoji.js |
| Lyrics Source | LRCLIB API (browser CORS-friendly) |
| Dictionary | JMDict common-only (`public/dict/jmdict-common.json`, ~22k words) + Core 1000 fallback (`src/lib/core1000Dict.ts`) + JLPT Vocab API fallback |
| Grammar Explanations | Local JSON dictionary (`src/lib/grammarDict.ts`) |
| State & Persistence | React hooks + `localStorage` |
| Deployment | GitHub Pages (via GitHub Actions) |

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
    jisho.ts                  # JLPT Vocab API client (local dict first, API fallback)
    core1000Dict.ts           # Bundled Core 1000 dictionary
    colorMap.ts               # Part-of-Speech → color logic
    grammarDict.ts            # Local conjugation/grammar explanations
public/
  dict/
    jmdict-common.json      # JMDict common-only dictionary (~22k words)
scripts/
  build-dict.ts             # Generates core1000Dict.ts from Jisho API
  types/
    index.ts                  # All TypeScript interfaces
  styles/
    index.css                 # Tailwind directives + custom styles
```

## Coding Conventions

1. **Components**: Always functional. Use named exports. Props interface named `{ComponentName}Props`.
2. **Hooks**: Custom hooks start with `use`. Keep them focused and composable.
3. **Types**: All shared types live in `src/types/index.ts`. No inline `any`.
4. **API Logic**: Isolate in `src/lib/`. No fetch calls inside components.
5. **Styling**: Tailwind utility classes. Custom CSS only for complex animations or font imports.
6. **No Error Handling**: We assume happy path. No try/catch, no loading skeletons, no error boundaries.
7. **No Routing**: This is a single page. Use component conditional rendering if needed.

## Grammar Color Coding

Each `WordToken` is wrapped in a square box. Colors indicate part-of-speech:

| Color | Style | POS Tags (Kuromoji) |
|-------|-------|---------------------|
| Blue | `border-blue-400 bg-blue-100` | 名詞 (noun), 代名詞 (pronoun), 固有名詞 (proper noun) |
| Yellow | `border-yellow-400 bg-yellow-100` | 助詞 (particle) |
| Green | `border-green-400 bg-green-100` | 動詞 (verb) — transitive/intransitive distinction deferred to later phase |
| Default (subtle gray) | `border-gray-200 bg-gray-50` | Everything else (adjectives, adverbs, etc.) |

## Breakdown Modal Content

When a user clicks a `WordToken`, show a popup with:

1. **Surface Form**: The word as it appears in the lyric (e.g., 殴れない)
2. **Reading (よみがな)**: Hiragana reading (e.g., なぐれない)
3. **Dictionary Form**: The unconjugated base form (e.g., 殴る)
4. **Grammar Explanation**: From local `grammarDict.ts` (e.g., "potential negative")
5. **Meaning**: From JMDict common-only (`public/dict/jmdict-common.json`), then Core 1000, then JLPT Vocab API

## localStorage Schema

Key: `kashi-gawa-library`

```ts
interface LibraryItem {
  id: number;            // LRCLIB track ID
  title: string;
  artist: string;
  plainLyrics: string;
  addedAt: string;       // ISO 8601 date
  tokens: Token[][] | null; // Kuromoji output per line. Null until parsed.
}
```

- Songs are ordered by `addedAt` (newest first).
- No size cap. User's device storage is the limit.

## External APIs

### LRCLIB
- Search: `GET https://lrclib.net/api/search?q={query}`
- Get by ID: `GET https://lrclib.net/api/get/{id}`
- Returns JSON with `id`, `name`, `artistName`, `plainLyrics`, etc.

### JLPT Vocab API
- Search: `GET https://jlpt-vocab-api.vercel.app/api/words?word={word}`
- Returns JSON with `words[].word`, `words[].meaning`, `words[].furigana`, `words[].level`.
- **Note**: This API is CORS-friendly and covers JLPT N5–N1 vocabulary. It serves as the fallback after local dictionaries.

## Deployment

GitHub Actions workflow in `.github/workflows/deploy.yml`:
- Trigger: push to `main`
- Steps: checkout → setup Node → install → build → deploy to GitHub Pages
- Vite `base` config must be set to repo name for GH Pages subpath hosting.

## Notes for AI Agents

- When adding new components, follow the existing component structure and Tailwind patterns.
- When adding grammar explanations, append to `src/lib/grammarDict.ts`.
- Always use the types from `src/types/index.ts`. Extend them if the data model changes.
- Keep the UI clean and minimal. Japanese text should be the hero.
- If a dependency needs to be added, prefer lightweight, browser-friendly packages.
