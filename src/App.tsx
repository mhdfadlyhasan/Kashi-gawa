import { useState, useEffect, useCallback } from 'react';
import { LibraryItem, Token } from './types';
import { useLyrics } from './hooks/useLyrics';
import { useLibrary } from './hooks/useLibrary';
import { useTokenizer } from './hooks/useTokenizer';
import { SearchBar } from './components/SearchBar';
import { SongLibrary } from './components/SongLibrary';
import { LyricDisplay } from './components/LyricDisplay';

function App() {
  const { results, search, selectTrack, clearResults } = useLyrics();
  const { library, addSong, removeSong, updateTokens, getSong } = useLibrary();
  const { ready: tokenizerReady, tokenizeLines } = useTokenizer();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [tokens, setTokens] = useState<Token[][]>([]);

  const activeSong = activeId ? getSong(activeId) : null;

  // When a track is selected from search
  const handleSelectTrack = useCallback(
    async (id: number) => {
      const track = await selectTrack(id);
      if (!track || !track.plainLyrics) return;

      const item: Omit<LibraryItem, 'addedAt' | 'tokens'> = {
        id: track.id,
        title: track.name,
        artist: track.artistName,
        plainLyrics: track.plainLyrics,
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
    },
    [tokenizerReady, tokenizeLines, updateTokens]
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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm z-10">
        <h1 className="text-xl font-bold text-gray-800 whitespace-nowrap">
          歌詞川
        </h1>
        <div className="flex-1 max-w-xl">
          <SearchBar
            onSearch={search}
            results={results}
            onSelect={handleSelectTrack}
            onClear={clearResults}
          />
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
            />
          </div>
        </aside>

        {/* Lyric Display */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeSong ? (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeSong.title}
                </h2>
                <p className="text-gray-500">{activeSong.artist}</p>
              </div>
              {tokens.length > 0 ? (
                <LyricDisplay lines={tokens} />
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
