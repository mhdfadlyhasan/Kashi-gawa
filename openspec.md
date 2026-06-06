# OpenSpec — Kashi-gawa Development Phases

## Overview

This document tracks the phased development of Kashi-gawa. Each phase has a clear deliverable and builds on the previous one. No phase should be started until the prior phase is complete.

---

## Phase 1: Skeleton & Layout

**Goal**: Initialize the project and create the basic shell UI.

**Deliverables**:
- [ ] Vite + React + TypeScript project scaffolded
- [ ] Tailwind CSS configured
- [ ] GitHub Actions workflow for GitHub Pages deployment
- [ ] Basic layout: header, main content area, sidebar placeholder
- [ ] App.tsx with basic state management (current song, library state)

**Files to create/modify**:
- `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`
- `.github/workflows/deploy.yml`
- `src/main.tsx`, `src/App.tsx`, `src/styles/index.css`

---

## Phase 2: Search & Fetch

**Goal**: Connect to LRCLIB API and fetch lyrics.

**Deliverables**:
- [ ] `src/lib/lrclib.ts` — LRCLIB API client (search + get by ID)
- [ ] `src/components/SearchBar.tsx` — Search input with live results
- [ ] `src/hooks/useLyrics.ts` — Fetch logic + basic in-memory caching
- [ ] Display plain text lyrics in `LyricDisplay.tsx` (no tokenization yet)
- [ ] Save fetched lyrics to `localStorage` via `useLibrary`

**Files to create/modify**:
- `src/lib/lrclib.ts`
- `src/components/SearchBar.tsx`
- `src/hooks/useLyrics.ts`
- `src/components/LyricDisplay.tsx`
- `src/hooks/useLibrary.ts`

---

## Phase 3: Library & Persistence

**Goal**: Build the sidebar library with localStorage persistence.

**Deliverables**:
- [ ] `src/hooks/useLibrary.ts` — Full CRUD for song library in localStorage
- [ ] `src/components/SongLibrary.tsx` — Sidebar showing saved songs, ordered by `addedAt`
- [ ] Click a library item to switch the active song
- [ ] Add current song to library button
- [ ] Delete song from library

**localStorage Schema** (finalized):
```ts
interface LibraryItem {
  id: number;
  title: string;
  artist: string;
  plainLyrics: string;
  addedAt: string; // ISO 8601
  tokens: Token[] | null;
}
```

**Files to create/modify**:
- `src/hooks/useLibrary.ts`
- `src/components/SongLibrary.tsx`
- `src/types/index.ts`

---

## Phase 4: Tokenization

**Goal**: Integrate Kuromoji.js to split lyrics into tokens.

**Deliverables**:
- [ ] `src/hooks/useTokenizer.ts` — Kuromoji.js initialization and tokenization
- [ ] `src/components/WordToken.tsx` — Render each token in a square box
- [ ] `src/components/LyricDisplay.tsx` — Map tokens to `WordToken` components
- [ ] Persist parsed tokens in `localStorage` so reopening is instant
- [ ] Handle re-tokenization if tokens are null

**Note**: For now, all verbs are green. Transitive/intransitive distinction is Phase 8.

**Files to create/modify**:
- `src/hooks/useTokenizer.ts`
- `src/components/WordToken.tsx`
- `src/components/LyricDisplay.tsx`

---

## Phase 5: Color Coding

**Goal**: Apply grammar-based colors to tokens.

**Deliverables**:
- [ ] `src/lib/colorMap.ts` — Map Kuromoji POS tags to Tailwind color classes
- [ ] Update `WordToken.tsx` to apply colors based on POS

**Color Rules**:
| POS | Color | Tailwind Classes |
|-----|-------|------------------|
| 名詞, 代名詞, 固有名詞 | Hollow | `border-gray-400 bg-transparent` |
| 助詞 | Yellow | `border-yellow-400 bg-yellow-100` |
| 動詞 | Green | `border-green-400 bg-green-100` |
| Everything else | Default | `border-gray-200 bg-gray-50` |

**Files to create/modify**:
- `src/lib/colorMap.ts`
- `src/components/WordToken.tsx`

---

## Phase 6: Breakdown Modal

**Goal**: Click a word to see grammar breakdown, reading, dictionary form, and meaning.

**Deliverables**:
- [ ] `src/components/BreakdownModal.tsx` — Popup modal component
- [ ] `src/lib/jisho.ts` — Jisho API client
- [ ] `src/lib/grammarDict.ts` — Local grammar pattern explanations (top 30 conjugations)
- [ ] Extract dictionary form from Kuromoji token features
- [ ] Show in modal: Surface form, Reading, Dictionary form, Grammar explanation, Meaning

**Grammar Dictionary Starter** (~30 patterns):
```ts
{
  "えない": "potential negative",
  "て": "te-form (connective)",
  "た": "past tense",
  "ます": "polite form",
  "ました": "polite past",
  "ません": "polite negative",
  "ませんでした": "polite past negative",
  "る": "dictionary form",
  "ない": "negative",
  "られる": "passive / potential",
  "させる": "causative",
  "よう": "volitional",
  "ば": "conditional",
  "たら": "past conditional",
  "ながら": "while doing",
  "ばかり": "just did",
  "っぱなし": "leave in a state",
  "切る": "do to completion",
  "始める": "begin to do",
  "終わる": "finish doing",
  "続ける": "continue doing",
  "易い": "easy to do",
  "難い": "difficult to do",
  "がち": "tend to do",
  "気味": "slightly tend to",
  "っこない": "never / not at all",
  "得る": "possible to do",
  "かける": "start to do / half-done",
  "出す": "start doing suddenly"
}
```

**Files to create/modify**:
- `src/components/BreakdownModal.tsx`
- `src/lib/jisho.ts`
- `src/lib/grammarDict.ts`
- `src/components/WordToken.tsx` (add onClick)

---

## Phase 7: Polish

**Goal**: Make it feel like a real app.

**Deliverables**:
- [ ] Add Japanese font (Noto Sans JP) via Google Fonts
- [ ] Responsive layout (mobile sidebar as drawer)
- [ ] Smooth transitions and hover effects on tokens
- [ ] Loading states (simple, no skeletons)
- [ ] Dark mode toggle (optional, if time permits)
- [ ] Final README.md for humans

**Files to create/modify**:
- `src/styles/index.css`
- `src/App.tsx`
- `README.md`

---

## Phase 8: Transitivity Detection (Future)

**Goal**: Distinguish transitive (他動詞) from intransitive (自動詞) verbs.

**Approach**:
- Fetch verb details from Jisho API
- Check `senses[].parts_of_speech[]` for "Transitive verb" or "Intransitive verb"
- Update `colorMap.ts`: Green for transitive, Blue for intransitive

**Not started until Phase 7 is complete.**

---

## Phase Status

| Phase | Status | Date Completed |
|-------|--------|----------------|
| P1: Skeleton | ⬜ Not started | — |
| P2: Search & Fetch | ⬜ Not started | — |
| P3: Library | ⬜ Not started | — |
| P4: Tokenization | ⬜ Not started | — |
| P5: Color Coding | ⬜ Not started | — |
| P6: Breakdown Modal | ⬜ Not started | — |
| P7: Polish | ⬜ Not started | — |
| P8: Transitivity | ⬜ Not started | — |

---

## Notes

- All API calls are browser-side. No backend.
- No error handling anywhere. Assume happy path.
- No tests. Manual testing only.
- No analytics, no auth, no tracking.
- Keep bundle size small. Tree-shake unused Tailwind classes.
