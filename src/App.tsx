import { useState, useEffect, useCallback } from 'react';
import { LibraryItem, Token } from './types';
import { useLyrics } from './hooks/useLyrics';
import { useLibrary } from './hooks/useLibrary';
import { useTokenizer, tokenizeText } from './hooks/useTokenizer';
import { useReadingMode } from './hooks/useReadingMode';
import { useFirstVisit } from './hooks/useFirstVisit';
import { SearchBar } from './components/SearchBar';
import { SongLibrary } from './components/SongLibrary';
import { LyricDisplay } from './components/LyricDisplay';
import { ReadingModeToggle } from './components/ReadingModeToggle';
import { WelcomeModal } from './components/WelcomeModal';
import { ToastContainer } from './components/ToastContainer';
import { kanaToRomaji } from './lib/kana';

function tokensToRomaji(tokens: Token[]): string {
  return tokens.map((t) => kanaToRomaji(t.reading || t.surface_form)).join(' ');
}

function App() {
  const { results, isLoading, isSelecting, search, selectTrack, clearResults } = useLyrics();
  const { library, addSong, removeSong, updateTokens, updateReadings, getSong } = useLibrary();
  const { ready: tokenizerReady, tokenizeLines } = useTokenizer();
  const { readingMode, setReadingMode } = useReadingMode();
  const [isFirstVisit, markSeen] = useFirstVisit();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [tokens, setTokens] = useState<Token[][]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const activeSong = activeId ? getSong(activeId) : null;

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
      };
      addSong(item);
      setActiveId(track.id);

      if (tokenizerReady) {
        const toks = await tokenizeLines(track.plainLyrics);
        setTokens(toks);
        updateTokens(track.id, toks);
      }
    },
    [selectTrack, addSong, tokenizerReady, tokenizeLines, updateTokens]
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
      if (song.tokens && song.tokens.length > 0) {
        setTokens(song.tokens);
      } else if (tokenizerReady) {
        const toks = await tokenizeLines(song.plainLyrics);
        setTokens(toks);
        updateTokens(song.id, toks);
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
    [tokenizerReady, tokenizeLines, updateTokens, updateReadings]
  );

  // Tokenize current track when tokenizer becomes ready
  useEffect(() => {
    if (!activeId || !tokenizerReady) return;
    const song = getSong(activeId);
    if (!song || (song.tokens && song.tokens.length > 0)) return;

    tokenizeLines(song.plainLyrics).then((toks) => {
      setTokens(toks);
      updateTokens(activeId, toks);
    });
  }, [activeId, tokenizerReady, tokenizeLines, updateTokens, getSong]);

  const handleReparse = useCallback(async () => {
    if (!activeId || !tokenizerReady) return;
    const song = getSong(activeId);
    if (!song) return;

    setTokens([]);
    const toks = await tokenizeLines(song.plainLyrics);
    setTokens(toks);
    updateTokens(activeId, toks);
  }, [activeId, tokenizerReady, getSong, tokenizeLines, updateTokens]);

  const displayTitle = activeSong && readingMode === 'romaji' && activeSong.titleReading
    ? activeSong.titleReading
    : activeSong?.title;

  const displayArtist = activeSong && readingMode === 'romaji' && activeSong.artistReading
    ? activeSong.artistReading
    : activeSong?.artist;

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 flex items-center gap-2 md:gap-4 shadow-sm z-10">
        <button
          className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
        <div className="ml-auto hidden md:block">
          <ReadingModeToggle readingMode={readingMode} onChange={setReadingMode} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden fixed inset-y-0 left-0 z-20 w-64 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
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
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {isSelecting ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">Loading song...</p>
                <p className="text-sm">曲を読み込み中...</p>
              </div>
            </div>
          ) : activeSong ? (
            <div>
              <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm mb-6 flex items-start justify-between gap-2 py-2 -mx-2 px-2 rounded-lg">
                <div className="min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                    {displayTitle}
                  </h2>
                  <p className="text-gray-500 truncate">{displayArtist}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    className={`p-2 rounded-lg border transition ${isEditMode ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent'}`}
                    onClick={() => setIsEditMode(!isEditMode)}
                    title="Toggle edit mode"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
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
              {tokens.length > 0 ? (
                <LyricDisplay
                  lines={tokens}
                  readingMode={readingMode}
                  isEditMode={isEditMode}
                  onTokensChange={(newLines) => {
                    setTokens(newLines);
                    if (activeId) {
                      updateTokens(activeId, newLines);
                    }
                  }}
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

      {isFirstVisit && <WelcomeModal onClose={markSeen} />}
      <ToastContainer />
    </div>
  );
}

export default App;
