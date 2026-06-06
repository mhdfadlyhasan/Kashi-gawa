import React, { useState } from 'react';
import { LrcLibTrack } from '../types';

interface SearchBarProps {
  onSearch: (query: string) => void;
  results: LrcLibTrack[];
  onSelect: (id: number) => void;
  onClear: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  results,
  onSelect,
  onClear,
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

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
          placeholder="曲名を検索..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
        >
          検索
        </button>
      </form>

      {results.length > 0 && (
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
