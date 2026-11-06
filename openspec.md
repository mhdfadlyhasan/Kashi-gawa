# OpenSpec — Kashi-gawa Development Phases

## Overview

This document tracks the phased development of Kashi-gawa. Each phase has a clear deliverable and builds on the previous one.

> **Status: Phases 1–7 are implemented.** This file is kept as the original plan; the [Phase Status](#phase-status) table is the source of truth. Work done beyond this spec is listed under [Beyond the Original Plan](#beyond-the-original-plan).

---

## Phase 1: Skeleton & Layout

**Goal**: Initialize the project and create the basic shell UI.

**Deliverables**:
- [x] Vite + React + TypeScript project scaffolded
- [x] Tailwind CSS configured
- [x] GitHub Actions workflow for GitHub Pages deployment
- [x] Basic layout: header, main content area, sidebar placeholder
- [x] App.tsx with basic state management (current song, library state)

**Files to create/modify**:
- `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`
- `.github/workflows/deploy.yml`
- `src/main.tsx`, `src/App.tsx`, `src/styles/index.css`

---

## Phase 2: Search & Fetch

**Goal**: Connect to LRCLIB API and fetch lyrics.

**Deliverables**:
- [x] `src/lib/lrclib.ts` — LRCLIB API client (search + get by ID)
- [x] `src/components/SearchBar.tsx` — Search input with live results
- [x] `src/hooks/useLyrics.ts` — Fetch logic + basic in-memory caching
- [x] Display plain text lyrics in `LyricDisplay.tsx` (no tokenization yet)
- [x] Save fetched lyrics to `localStorage` via `useLibrary`

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
- [x] `src/hooks/useLibrary.ts` — Full CRUD for song library in localStorage
- [x] `src/components/SongLibrary.tsx` — Sidebar showing saved songs, ordered by `addedAt`
- [x] Click a library item to switch the active song
- [x] Add current song to library button
- [x] Delete song from library

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
- [x] `src/hooks/useTokenizer.ts` — Kuromoji.js initialization and tokenization
- [x] `src/components/WordToken.tsx` — Render each token in a square box
- [x] `src/components/LyricDisplay.tsx` — Map tokens to `WordToken` components
- [x] Persist parsed tokens in `localStorage` so reopening is instant
- [x] Handle re-tokenization if tokens are null

**Note**: For now, all verbs are green. Transitive/intransitive distinction is Phase 8.

**Files to create/modify**:
- `src/hooks/useTokenizer.ts`
- `src/components/WordToken.tsx`
- `src/components/LyricDisplay.tsx`

---

## Phase 5: Color Coding

**Goal**: Apply grammar-based colors to tokens.

**Deliverables**:
- [x] `src/lib/colorMap.ts` — Map Kuromoji POS tags to Tailwind color classes
- [x] Update `WordToken.tsx` to apply colors based on POS

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
- [x] `src/components/BreakdownModal.tsx` — Popup modal component
- [x] `src/lib/jisho.ts` — Jisho API client
- [x] `src/lib/grammarDict.ts` — Local grammar pattern explanations (top 30 conjugations)
- [x] Extract dictionary form from Kuromoji token features
- [x] Show in modal: Surface form, Reading, Dictionary form, Grammar explanation, Meaning

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
- [x] Add Japanese font (Noto Sans JP) via Google Fonts
- [x] Responsive layout (mobile sidebar as drawer)
- [x] Smooth transitions and hover effects on tokens
- [x] Loading states (simple, no skeletons)
- [ ] Dark mode toggle (optional, not implemented)
- [x] Final README.md for humans

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

**Phase 7 is complete, so this phase is ready to start. Not yet started.**

---

## Phase Status

| Phase | Status | Date Completed |
|-------|--------|----------------|
| P1: Skeleton | ✅ Done | 2026-06 |
| P2: Search & Fetch | ✅ Done | 2026-06 |
| P3: Library | ✅ Done | 2026-06 |
| P4: Tokenization | ✅ Done | 2026-06 |
| P5: Color Coding | ✅ Done | 2026-06 |
| P6: Breakdown Modal | ✅ Done | 2026-06 |
| P7: Polish | ✅ Done (dark mode skipped) | 2026-06 |
| P8: Transitivity | ⬜ Not started | — |

---

## Beyond the Original Plan

Features added after the original phases, now part of the shipped app:

- **Reading modes** — normal, hiragana, katakana, furigana, and romaji (`src/lib/kana.ts`)
- **Compact breakdown mode** — inline sticky panel alongside the popup modal
- **Edit mode** — manually merge adjacent tokens or split a token by clicking between characters
- **Re-parse action** — re-run tokenization (with confirmation) when edits go wrong
- **Toast notifications** — error surfacing via `src/lib/toast.ts`
- **Welcome modal** — first-visit onboarding, dismissed state persisted
- **Mobile sidebar drawer** — responsive layout
- **Dictionary fallback chain** — JMDict → Core 1000 → JLPT Vocab API → Wiktionary
- **Tooling** — ESLint, Prettier, typecheck, and GitHub Actions CI

Remaining gaps are tracked in the README ("Known Gaps").

---

## Notes

- All API calls are browser-side. No backend.
- Errors are surfaced with toast notifications; there are no error boundaries or retry logic.
- No automated tests yet. Verify with `npm run lint`, `npm run typecheck`, and manual testing.
- No analytics, no auth, no tracking.
- Keep bundle size small. Tree-shake unused Tailwind classes.
