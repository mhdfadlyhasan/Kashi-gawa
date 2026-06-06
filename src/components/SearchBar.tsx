import React, { useState } from 'react';
import { LrcLibTrack } from '../types';
import { ReadingMode } from '../lib/kana';

interface SearchBarProps {
  onSearch: (query: string) => void;
  results: LrcLibTrack[];
  isLoading: boolean;
  isSelecting: boolean;
  onSelect: (id: number) => void;
  onClear: () => void;
  readingMode: ReadingMode;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  results,
  isLoading,
  isSelecting,
  onSelect,
  onClear,
  readingMode,
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const placeholder = readingMode === 'romaji' ? 'kyokumei wo kensaku...' : '曲名を検索...';
  const searchLabel = isLoading
    ? (readingMode === 'romaji' ? 'kensaku chuu...' : '検索中...')
    : (readingMode === 'romaji' ? 'kensaku' : '検索');
  const loadingLabel = readingMode === 'romaji' ? 'kensaku chuu...' : '検索中...';
  const selectingLabel = readingMode === 'romaji' ? 'yomikomi chuu...' : '読み込み中...';

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) onClear();
          }}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {searchLabel}
        </button>
      </form>

      {isLoading && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500">
          {loadingLabel}
        </div>
      )}

      {isSelecting && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500">
          {selectingLabel}
        </div>
      )}

      {!isSelecting && results.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((track) => (
            <button
              key={track.id}
              onClick={() => {
                onSelect(track.id);
                setQuery('');
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{track.name}</div>
              <div className="text-sm text-gray-500">{track.artistName}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
