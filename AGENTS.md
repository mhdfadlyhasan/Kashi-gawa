# AGENTS.md — Kashi-gawa

## Project Overview

Kashi-gawa (歌詞川, "Lyrics River") is a single-page web application for learning Japanese through song lyrics. Users search for songs, fetch Japanese lyrics, and interact with a color-coded, tokenized display where each word can be clicked for a grammar and vocabulary breakdown.

## Core Philosophy

- **No direct translation.** The goal is to learn Japanese, not to read translations.
- **Grammar through interaction.** Colors and click-to-reveal breakdowns teach patterns naturally.
- **Simplicity first.** This is a learning tool, not a production SaaS. No backend.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Build Tool | Vite |
| Framework | React 19 (Functional Components + Hooks only) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Japanese Tokenization | Kuromoji.js |
| Lyrics Source | LRCLIB API (browser CORS-friendly) |
| Dictionary | JMDict common-only (`public/dict/jmdict-common.json`, ~22k words) + Core 1000 fallback (`src/lib/core1000Dict.ts`) + JLPT Vocab API + Wiktionary |
| Grammar Explanations | Local JSON dictionary (`src/lib/grammarDict.ts`) |
| State & Persistence | React hooks + `localStorage` |
| Quality | ESLint + Prettier + TypeScript typecheck |
| Deployment | GitHub Pages (via GitHub Actions) |

## Project Structure

```
src/
  main.tsx                  # Entry point
  App.tsx                   # Root component, layout shell, song loading
  components/
    SearchBar.tsx           # Song search input + LRCLIB search results
    SongLibrary.tsx         # Sidebar list of saved songs
    LyricDisplay.tsx        # Main area: renders tokenized lyrics, merge/split editing
    WordToken.tsx           # Individual boxed/colored word
    BreakdownModal.tsx      # Click popup: grammar, dict form, meaning, reading
    CompactBreakdown.tsx    # Inline sticky breakdown panel
    ReadingModeToggle.tsx   # Normal / hiragana / katakana / furigana / romaji
    DetailModeToggle.tsx    # Popup / compact breakdown mode
    WelcomeModal.tsx        # First-visit onboarding
    ToastContainer.tsx      # Toast notification renderer
  hooks/
    useLyrics.ts            # LRCLIB fetch + in-memory result state
    useLibrary.ts           # localStorage CRUD for the song library
    useTokenizer.ts         # Kuromoji.js init, tokenization, token merging
    useWordBreakdown.ts     # Dictionary + grammar lookup for a token
    useReadingMode.ts       # Persisted reading mode
    useDetailMode.ts        # Persisted detail display mode
    useFirstVisit.ts        # Persisted welcome modal state
  lib/
    lrclib.ts               # LRCLIB API client
    jisho.ts                # Local dictionaries + JLPT/Wiktionary fallbacks
    core1000Dict.ts         # Bundled Core 1000 dictionary (generated)
    grammarDict.ts          # Suffix-based grammar explanations
    kana.ts                 # Kana/romaji conversion + reading modes
    colorMap.ts             # Part-of-Speech → color/label logic
    toast.ts                # Tiny toast event bus
  types/
    index.ts                # All TypeScript interfaces
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

## Coding Conventions

1. **Components**: Always functional. Use named exports. Props interface named `{ComponentName}Props`.
2. **Hooks**: Custom hooks start with `use`. Keep them focused and composable.
3. **Types**: All shared types live in `src/types/index.ts`. Avoid inline `any` where practical (existing `any` in the Kuromoji adapter is a known gap).
4. **API Logic**: Isolate in `src/lib/`. No fetch calls inside components.
5. **Styling**: Tailwind utility classes. Custom CSS only for complex animations or font imports.
6. **Errors**: Surface failures through `showToast` from `src/lib/toast.ts`. No error boundaries or retry logic yet; assume the happy path otherwise.
7. **No Routing**: This is a single page. Use component conditional rendering if needed.
8. **Formatting**: Prettier is authoritative. Run `npm run format` after edits.

## Grammar Color Coding

Each `WordToken` is wrapped in a square box. Colors indicate part-of-speech:

| Color | Style | POS Tags (Kuromoji) |
|-------|-------|---------------------|
| Blue | `border-blue-400 bg-blue-100` | 名詞 (noun), 代名詞 (pronoun), 固有名詞 (proper noun) |
| Yellow | `border-yellow-400 bg-yellow-100` | 助詞 (particle) |
| Green | `border-green-400 bg-green-100` | 動詞 (verb) — transitive/intransitive distinction deferred |
| Red | `border-red-400 bg-red-100` | 形容詞 (i-adjective), 形容動詞 (na-adjective) |
| Purple | `border-purple-400 bg-purple-100` | 副詞 (adverb) |
| Orange | `border-orange-400 bg-orange-100` | 感動詞 (interjection) |
| Pink | `border-pink-400 bg-pink-100` | 連体詞 (adnominal) |
| Default (subtle gray) | `border-gray-200 bg-gray-50` | Everything else |

## Breakdown Modal Content

When a user clicks a `WordToken`, show (popup or compact mode):

1. **Surface Form**: The word as it appears in the lyric (e.g., 殴れない)
2. **Reading (よみがな)**: Converted per the active reading mode (e.g., なぐれない)
3. **Dictionary Form**: The unconjugated base form (e.g., 殴る)
4. **Grammar Explanation**: From local `grammarDict.ts` (e.g., "potential negative")
5. **Meaning**: From JMDict common-only, then Core 1000, then JLPT Vocab API, then Wiktionary

## Reading Modes

`ReadingMode` is `'normal' | 'hiragana' | 'katakana' | 'furigana' | 'romaji'`, handled in `src/lib/kana.ts`. The selected mode is persisted in `localStorage`.

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
  titleReading?: string;    // Roma-ji reading for romaji mode
  artistReading?: string;   // Roma-ji reading for romaji mode
}
```

Other persisted keys:

- `kashi-gawa-reading-mode`
- `kashi-gawa-detail-mode`
- `kashi-gawa-welcome-shown`

- Songs are ordered by `addedAt` (newest first).
- No size cap or schema version. User's device storage is the limit.

## External APIs

### LRCLIB
- Search: `GET https://lrclib.net/api/search?q={query}`
- Get by ID: `GET https://lrclib.net/api/get/{id}`
- Returns JSON with `id`, `name`, `artistName`, `plainLyrics`, etc.

### JLPT Vocab API
- Search: `GET https://jlpt-vocab-api.vercel.app/api/words?word={word}`
- Returns JSON with `words[].word`, `words[].meaning`, `words[].furigana`, `words[].level`.
- CORS-friendly; used after local dictionaries fail.

### Wiktionary
- `GET https://en.wiktionary.org/api/rest_v1/page/definition/{word}`
- Last-resort fallback for words missing from the other sources.

## Tooling

- `npm run lint` — ESLint (flat config in `eslint.config.js`)
- `npm run typecheck` — `tsc --noEmit`
- `npm run format` / `npm run format:check` — Prettier
- `npm run build` — typecheck + production build

Generated files and large assets are excluded from lint/format: `src/lib/core1000Dict.ts`, `public/`.

## Deployment

GitHub Actions workflows in `.github/workflows/`:
- `deploy.yml` — on push to `main`: install → lint → typecheck → build → deploy to GitHub Pages
- `ci.yml` — on pull requests / non-`main` branches: lint → typecheck → format check → build

Vite `base` must stay set to `/Kashi-gawa/` for GH Pages subpath hosting.

## Notes for AI Agents

- When adding new components, follow the existing component structure and Tailwind patterns.
- When adding grammar explanations, append to `src/lib/grammarDict.ts`.
- Always use the types from `src/types/index.ts`. Extend them if the data model changes.
- Keep the UI clean and minimal. Japanese text should be the hero.
- If a dependency needs to be added, prefer lightweight, browser-friendly packages.
- There are no automated tests yet. Verify changes with `npm run lint`, `npm run typecheck`, and manual testing.
