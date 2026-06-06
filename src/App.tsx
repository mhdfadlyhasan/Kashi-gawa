import { useState, useEffect, useCallback } from 'react';
import { LibraryItem, Token } from './types';
import { useLyrics } from './hooks/useLyrics';
import { useLibrary } from './hooks/useLibrary';
import { useTokenizer, tokenizeText } from './hooks/useTokenizer';
import { useReadingMode } from './hooks/useReadingMode';
import { SearchBar } from './components/SearchBar';
import { SongLibrary } from './components/SongLibrary';
import { LyricDisplay } from './components/LyricDisplay';
import { ReadingModeToggle } from './components/ReadingModeToggle';
import { kanaToRomaji } from './lib/kana';

function tokensToRomaji(tokens: Token[]): string {
  return tokens.map((t) => kanaToRomaji(t.reading || t.surface_form)).join(' ');
}

function App() {
  const { results, isLoading, isSelecting, search, selectTrack, clearResults } = useLyrics();
  const { library, addSong, removeSong, updateTokens, updateReadings, getSong } = useLibrary();
  const { ready: tokenizerReady, tokenizeLines } = useTokenizer();
  const { readingMode, setReadingMode } = useReadingMode();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [tokens, setTokens] = useState<Token[][]>([]);

  const activeSong = activeId ? getSong(activeId) : null;

  // When a track is selected from search
  const handleSelectTrack = useCallback(
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm z-10">
        <h1 className="text-xl font-bold text-gray-800 whitespace-nowrap">
          {readingMode === 'romaji' ? 'kashi-gawa' : '歌詞川'}
        </h1>
        <div className="flex-1 max-w-xl">
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
        <div className="ml-auto">
          <ReadingModeToggle readingMode={readingMode} onChange={setReadingMode} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden">
          <div className="h-full p-4">
            <SongLibrary
              library={library}
              activeId={activeId}
              onSelect={handleSelectLibraryItem}
              onRemove={removeSong}
              readingMode={readingMode}
            />
          </div>
        </aside>

        {/* Lyric Display */}
        <main className="flex-1 overflow-y-auto p-8">
          {isSelecting ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">Loading song...</p>
                <p className="text-sm">曲を読み込み中...</p>
              </div>
            </div>
          ) : activeSong ? (
            <div>
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {displayTitle}
                  </h2>
                  <p className="text-gray-500">{displayArtist}</p>
                </div>
                <button
                  onClick={handleReparse}
                  disabled={!tokenizerReady}
                  className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {readingMode === 'romaji' ? 'sai kaiseki' : '再解析'}
                </button>
              </div>
              {tokens.length > 0 ? (
                <LyricDisplay lines={tokens} readingMode={readingMode} />
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
    </div>
  );
}

export default App;
