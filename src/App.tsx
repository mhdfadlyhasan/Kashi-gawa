import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnkiCard, LibraryItem, TimedToken, Token, TokenSelection, WordBreakdown } from './types';
import { useLyrics } from './hooks/useLyrics';
import { useLibrary } from './hooks/useLibrary';
import { useTokenizer, tokenizeText, tokenizeLinesText } from './hooks/useTokenizer';
import { useReadingMode } from './hooks/useReadingMode';
import { useFirstVisit } from './hooks/useFirstVisit';
import { useDetailMode } from './hooks/useDetailMode';
import { useAnkiCards } from './hooks/useAnkiCards';
import { SearchBar } from './components/SearchBar';
import { SongLibrary } from './components/SongLibrary';
import { LyricDisplay } from './components/LyricDisplay';
import { ReadingModeToggle } from './components/ReadingModeToggle';
import { DetailModeToggle } from './components/DetailModeToggle';
import { CompactBreakdown } from './components/CompactBreakdown';
import { KaraokeBar } from './components/KaraokeBar';
import { AnkiCardEditor } from './components/AnkiCardEditor';
import { AnkiQueueModal } from './components/AnkiQueueModal';
import { WelcomeModal } from './components/WelcomeModal';
import { ToastContainer } from './components/ToastContainer';
import { convertReading, kanaToRomaji } from './lib/kana';
import { tokensToSentenceHtml } from './lib/anki';
import { lrcHasWordTiming, parseLrc, toTimedEntries } from './lib/lrc';
import { buildTimedLines, buildTimedTokens, findActive, getDurationMs } from './lib/karaoke';
import { parseYouTubeId } from './lib/youtube';
import { showToast } from './lib/toast';

function tokensToRomaji(tokens: Token[]): string {
  return tokens.map((t) => kanaToRomaji(t.reading || t.surface_form)).join(' ');
}

async function tokenizeSyncedLyrics(syncedLyrics: string): Promise<Token[][]> {
  const entries = toTimedEntries(parseLrc(syncedLyrics));
  const result: Token[][] = [];
  for (const entry of entries) {
    const text = entry.text.trim();
    if (!text) continue;
    result.push(await tokenizeText(text));
  }
  return result;
}

async function tokenizeSongLyrics(lyrics: {
  plainLyrics: string;
  syncedLyrics?: string | null;
}): Promise<{ tokens: Token[][]; source: 'plain' | 'synced' }> {
  if (lyrics.syncedLyrics && lyrics.syncedLyrics.trim()) {
    const syncedTokens = await tokenizeSyncedLyrics(lyrics.syncedLyrics);
    if (syncedTokens.length > 0) return { tokens: syncedTokens, source: 'synced' };
  }
  return { tokens: await tokenizeLinesText(lyrics.plainLyrics), source: 'plain' };
}

function App() {
  const { results, isLoading, isSelecting, search, selectTrack, clearResults } = useLyrics();
  const { library, addSong, removeSong, updateTokens, updateReadings, updateSong, getSong } =
    useLibrary();
  const { ready: tokenizerReady } = useTokenizer();
  const { readingMode, setReadingMode } = useReadingMode();
  const { detailMode, setDetailMode } = useDetailMode();
  const [isFirstVisit, markSeen] = useFirstVisit();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [tokens, setTokens] = useState<Token[][]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selection, setSelection] = useState<TokenSelection | null>(null);
  const [isKaraoke, setIsKaraoke] = useState(false);
  const [karaokeElapsedMs, setKaraokeElapsedMs] = useState(0);

  const {
    cards: ankiCards,
    deckName,
    setDeckName,
    saveCard,
    removeCard,
    clearCards,
    getCard,
  } = useAnkiCards();
  const [ankiEditor, setAnkiEditor] = useState<AnkiCard | null>(null);
  const [ankiQueueOpen, setAnkiQueueOpen] = useState(false);

  const activeSong = activeId ? getSong(activeId) : null;
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const element = headerRef.current;
    if (!element) return;
    const update = () => setHeaderHeight(element.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [activeSong?.id]);

  const karaokeTiming = useMemo(() => {
    if (!isKaraoke || !activeSong?.syncedLyrics || tokens.length === 0) {
      return { timed: [] as TimedToken[], durationMs: 0 };
    }
    const timedLines = buildTimedLines(
      activeSong.syncedLyrics,
      tokens,
      (activeSong.duration ?? 0) * 1000
    );
    const timed = buildTimedTokens(timedLines);
    return { timed, durationMs: getDurationMs(activeSong.duration, timed) };
  }, [isKaraoke, activeSong?.syncedLyrics, activeSong?.duration, tokens]);

  const activePosition = useMemo(
    () => (isKaraoke ? findActive(karaokeElapsedMs, karaokeTiming.timed) : null),
    [isKaraoke, karaokeElapsedMs, karaokeTiming.timed]
  );

  const hasWordTiming = useMemo(() => {
    if (!isKaraoke || !activeSong?.syncedLyrics) return false;
    return lrcHasWordTiming(activeSong.syncedLyrics);
  }, [isKaraoke, activeSong?.syncedLyrics]);

  // Load and activate a song by ID
  const loadAndActivateSong = useCallback(
    async (id: number) => {
      const track = await selectTrack(id);
      if (!track || !track.plainLyrics) return;

      let titleReading: string | undefined;
      let artistReading: string | undefined;

      if (tokenizerReady) {
        const titleTokens = await tokenizeText(track.name);
        titleReading = tokensToRomaji(titleTokens);
        const artistTokens = await tokenizeText(track.artistName);
        artistReading = tokensToRomaji(artistTokens);
      }

      const item: Omit<LibraryItem, 'addedAt' | 'tokens'> = {
        id: track.id,
        title: track.name,
        artist: track.artistName,
        plainLyrics: track.plainLyrics,
        titleReading,
        artistReading,
        syncedLyrics: track.syncedLyrics,
        duration: track.duration,
      };
      addSong(item);
      setActiveId(track.id);
      setIsKaraoke(false);
      setKaraokeElapsedMs(0);

      if (tokenizerReady) {
        const { tokens: toks, source } = await tokenizeSongLyrics({
          plainLyrics: track.plainLyrics,
          syncedLyrics: track.syncedLyrics,
        });
        setTokens(toks);
        updateTokens(track.id, toks);
        updateSong(track.id, { tokensSource: source });
      }
    },
    [selectTrack, addSong, tokenizerReady, updateTokens, updateSong]
  );

  // Load default song on first visit
  useEffect(() => {
    if (library.length === 0) {
      loadAndActivateSong(23264143);
    }
  }, [library.length, loadAndActivateSong]);

  // When a track is selected from search
  const handleSelectTrack = useCallback(
    async (id: number) => {
      loadAndActivateSong(id);
    },
    [loadAndActivateSong]
  );

  // When a library item is clicked
  const handleSelectLibraryItem = useCallback(
    async (song: LibraryItem) => {
      setActiveId(song.id);
      setIsKaraoke(false);
      setKaraokeElapsedMs(0);
      if (song.tokens && song.tokens.length > 0) {
        setTokens(song.tokens);
      } else if (tokenizerReady) {
        const { tokens: toks, source } = await tokenizeSongLyrics(song);
        setTokens(toks);
        updateTokens(song.id, toks);
        updateSong(song.id, { tokensSource: source });
      }

      // Compute readings if missing
      if (tokenizerReady && (!song.titleReading || !song.artistReading)) {
        const titleTokens = await tokenizeText(song.title);
        const titleReading = tokensToRomaji(titleTokens);
        const artistTokens = await tokenizeText(song.artist);
        const artistReading = tokensToRomaji(artistTokens);
        updateReadings(song.id, titleReading, artistReading);
      }
    },
    [tokenizerReady, updateTokens, updateReadings, updateSong]
  );

  // Tokenize current track when tokenizer becomes ready
  useEffect(() => {
    if (!activeId || !tokenizerReady) return;
    const song = getSong(activeId);
    if (!song || (song.tokens && song.tokens.length > 0)) return;

    tokenizeSongLyrics(song).then(({ tokens: toks, source }) => {
      setTokens(toks);
      updateTokens(activeId, toks);
      updateSong(activeId, { tokensSource: source });
    });
  }, [activeId, tokenizerReady, updateTokens, updateSong, getSong]);

  const handleReparse = useCallback(async () => {
    if (!activeId || !tokenizerReady) return;
    const song = getSong(activeId);
    if (!song) return;

    const confirmed = window.confirm(
      readingMode === 'romaji'
        ? 'Re-parsing will delete all edits you made. Are you sure?'
        : '再解析を行うと、すべての編集内容が削除されます。よろしいですか？'
    );
    if (!confirmed) return;

    setTokens([]);
    const { tokens: toks, source } = await tokenizeSongLyrics(song);
    setTokens(toks);
    updateTokens(activeId, toks);
    updateSong(activeId, { tokensSource: source });
  }, [activeId, tokenizerReady, getSong, updateTokens, updateSong, readingMode]);

  const handleTokensChange = useCallback(
    (newLines: Token[][]) => {
      setTokens(newLines);
      if (activeId) updateTokens(activeId, newLines);
    },
    [activeId, updateTokens]
  );

  const handleToggleKaraoke = useCallback(async () => {
    if (isKaraoke) {
      setIsKaraoke(false);
      return;
    }

    const song = activeSong;
    if (!song) return;
    if (tokens.length === 0) {
      showToast('Lyrics are still parsing — try again in a moment');
      return;
    }

    let syncedLyrics = song.syncedLyrics ?? null;
    if (!syncedLyrics) {
      const track = await selectTrack(song.id);
      if (!track?.syncedLyrics) {
        showToast('This song has no synced lyrics — karaoke unavailable');
        return;
      }
      syncedLyrics = track.syncedLyrics;
      updateSong(song.id, { syncedLyrics, duration: track.duration });
    }

    if (song.tokensSource !== 'synced') {
      const confirmed = window.confirm(
        readingMode === 'romaji'
          ? 'Karaoke uses the synced lyrics, which resets your manual word edits. Continue?'
          : 'カラオケは同期歌詞を使用するため、単語の編集内容がリセットされます。続けますか？'
      );
      if (!confirmed) return;

      const toks = await tokenizeSyncedLyrics(syncedLyrics);
      if (toks.length === 0) {
        showToast('Could not parse the synced lyrics');
        return;
      }
      setTokens(toks);
      updateTokens(song.id, toks);
      updateSong(song.id, { tokensSource: 'synced' });
    }

    setKaraokeElapsedMs(0);
    setIsKaraoke(true);
  }, [isKaraoke, activeSong, tokens.length, selectTrack, updateSong, updateTokens, readingMode]);

  const handleSetYouTube = useCallback(
    (input: string) => {
      if (!activeSong) return;
      const trimmed = input.trim();
      if (!trimmed) {
        updateSong(activeSong.id, { youtubeId: undefined, youtubeOffsetMs: 0 });
        setKaraokeElapsedMs(0);
        return;
      }
      const id = parseYouTubeId(trimmed);
      if (!id) {
        showToast('Could not read that YouTube link');
        return;
      }
      updateSong(activeSong.id, { youtubeId: id });
      setKaraokeElapsedMs(0);
    },
    [activeSong, updateSong]
  );

  const handleOffsetChange = useCallback(
    (ms: number) => {
      if (!activeSong) return;
      updateSong(activeSong.id, { youtubeOffsetMs: ms });
    },
    [activeSong, updateSong]
  );

  const handleAddToAnki = useCallback(
    (breakdown: WordBreakdown) => {
      if (!selection || !activeSong) return;
      const { token, line, lineIdx, tokenIdx } = selection;
      const id = `${activeSong.id}-${lineIdx}-${token.surface_form}-${token.basic_form}`;

      setSelection(null);

      const existing = getCard(id);
      if (existing) {
        setAnkiEditor(existing);
        return;
      }

      const term = breakdown.dictionaryForm || token.basic_form || token.surface_form;
      const rawReading =
        breakdown.dictionaryReading ||
        (term === token.surface_form && token.reading !== '*' ? token.reading : '');
      const reading = rawReading ? convertReading(rawReading, 'hiragana') : '';

      setAnkiEditor({
        id,
        term,
        reading,
        surface: token.surface_form,
        meaning: breakdown.meanings.join('; '),
        sentence: line.map((part) => part.surface_form).join(''),
        sentenceFurigana: tokensToSentenceHtml(
          line.map((part) => ({ surface: part.surface_form, reading: part.reading || '' })),
          tokenIdx
        ),
        sentenceMeaning: '',
        notes: '',
        sourceTitle: activeSong.title,
        sourceArtist: activeSong.artist,
        addedAt: new Date().toISOString(),
      });
    },
    [selection, activeSong, getCard]
  );

  const handleSaveAnkiCard = useCallback(
    (card: AnkiCard) => {
      saveCard(card);
      setAnkiEditor(null);
      showToast('Card saved to the Anki queue');
    },
    [saveCard]
  );

  const displayTitle =
    activeSong && readingMode === 'romaji' && activeSong.titleReading
      ? activeSong.titleReading
      : activeSong?.title;

  const displayArtist =
    activeSong && readingMode === 'romaji' && activeSong.artistReading
      ? activeSong.artistReading
      : activeSong?.artist;

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 flex items-center gap-2 md:gap-4 shadow-sm relative z-30">
        <button
          className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <h1 className="text-lg md:text-xl font-bold text-gray-800 whitespace-nowrap">
          {readingMode === 'romaji' ? 'kashi-gawa' : '歌詞川'}
        </h1>
        <div className="flex-1 min-w-0 max-w-full md:max-w-xl">
          <SearchBar
            onSearch={search}
            results={results}
            isLoading={isLoading}
            isSelecting={isSelecting}
            onSelect={handleSelectTrack}
            onClear={clearResults}
            readingMode={readingMode}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setAnkiQueueOpen(true)}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition text-xs font-medium"
            title="Anki queue"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="7" width="13" height="13" rx="2" />
              <path d="M7 4h11a2 2 0 012 2v11" />
            </svg>
            <span className="hidden sm:inline">Anki</span>
            {ankiCards.length > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {ankiCards.length}
              </span>
            )}
          </button>
          <div className="hidden md:block">
            <ReadingModeToggle readingMode={readingMode} onChange={setReadingMode} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden fixed inset-y-0 left-0 z-40 md:z-20 w-64 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full p-4 pt-14 md:pt-4">
            <div className="md:hidden mb-4">
              <ReadingModeToggle readingMode={readingMode} onChange={setReadingMode} />
            </div>
            <SongLibrary
              library={library}
              activeId={activeId}
              onSelect={(song) => {
                handleSelectLibraryItem(song);
                setSidebarOpen(false);
              }}
              onRemove={removeSong}
              readingMode={readingMode}
            />
          </div>
        </aside>

        {/* Lyric Display */}
        <main className="flex-1 overflow-y-auto px-2 pb-4 md:px-4 md:pb-8">
          {isSelecting ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">Loading song...</p>
                <p className="text-sm">曲を読み込み中...</p>
              </div>
            </div>
          ) : activeSong ? (
            <div>
              <div
                ref={headerRef}
                className={`sticky top-0 z-30 bg-gray-50/95 backdrop-blur-sm mb-6 pt-4 md:pt-8 pb-2 -mx-2 px-2 rounded-lg ${detailMode === 'compact' ? 'min-h-[120px]' : ''}`}
              >
                {detailMode === 'compact' && selection ? (
                  <CompactBreakdown
                    token={selection.token}
                    onClose={() => setSelection(null)}
                    readingMode={readingMode}
                    onAddToAnki={handleAddToAnki}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                        {displayTitle}
                      </h2>
                      <p className="text-gray-500 truncate">{displayArtist}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <DetailModeToggle detailMode={detailMode} onChange={setDetailMode} />
                      <button
                        className={`p-2 rounded-lg border transition ${isKaraoke ? 'bg-sky-100 text-sky-700 border-sky-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent'}`}
                        onClick={handleToggleKaraoke}
                        title="Karaoke mode"
                        aria-pressed={isKaraoke}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13" />
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="18" cy="16" r="3" />
                        </svg>
                      </button>
                      <button
                        className={`p-2 rounded-lg border transition ${isEditMode ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent'}`}
                        onClick={() => setIsEditMode(!isEditMode)}
                        title="Toggle edit mode"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={handleReparse}
                        disabled={!tokenizerReady}
                        className="flex-shrink-0 px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {readingMode === 'romaji' ? 'sai kaiseki' : '再解析'}
                      </button>
                    </div>
                  </div>
                )}
                {isKaraoke && (
                  <KaraokeBar
                    durationMs={karaokeTiming.durationMs}
                    youtubeId={activeSong.youtubeId}
                    youtubeOffsetMs={activeSong.youtubeOffsetMs ?? 0}
                    onElapsedChange={setKaraokeElapsedMs}
                    onSetYouTube={handleSetYouTube}
                    onOffsetChange={handleOffsetChange}
                    onClose={() => setIsKaraoke(false)}
                  />
                )}
              </div>
              {tokens.length > 0 ? (
                <LyricDisplay
                  lines={tokens}
                  readingMode={readingMode}
                  isEditMode={isEditMode}
                  detailMode={detailMode}
                  selectedToken={selection}
                  setSelectedToken={setSelection}
                  onAddToAnki={handleAddToAnki}
                  isKaraoke={isKaraoke}
                  activeLineIdx={activePosition?.lineIdx ?? -1}
                  activeTokenIdx={activePosition?.tokenIdx ?? -1}
                  useWordHighlighting={hasWordTiming}
                  stickyOffset={headerHeight}
                  headerRef={headerRef}
                  onTokensChange={handleTokensChange}
                />
              ) : (
                <div className="text-gray-400">Parsing lyrics...</div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">Search for a song to get started</p>
                <p className="text-sm">歌詞を検索してください</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {ankiEditor && (
        <AnkiCardEditor
          initial={ankiEditor}
          deckName={deckName}
          onDeckNameChange={setDeckName}
          onSave={handleSaveAnkiCard}
          onClose={() => setAnkiEditor(null)}
        />
      )}

      {ankiQueueOpen && (
        <AnkiQueueModal
          cards={ankiCards}
          deckName={deckName}
          onDeckNameChange={setDeckName}
          onEdit={(card) => setAnkiEditor(card)}
          onRemove={removeCard}
          onClear={clearCards}
          onClose={() => setAnkiQueueOpen(false)}
        />
      )}

      {isFirstVisit && <WelcomeModal onClose={markSeen} />}
      <ToastContainer />
    </div>
  );
}

export default App;
