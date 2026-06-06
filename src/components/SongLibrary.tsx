import React from 'react';
import { LibraryItem } from '../types';
import { ReadingMode } from '../lib/kana';

interface SongLibraryProps {
  library: LibraryItem[];
  activeId: number | null;
  onSelect: (song: LibraryItem) => void;
  onRemove: (id: number) => void;
  readingMode: ReadingMode;
}

export const SongLibrary: React.FC<SongLibraryProps> = ({
  library,
  activeId,
  onSelect,
  onRemove,
  readingMode,
}) => {
  const getDisplayText = (text: string, reading?: string) => {
    if (readingMode === 'romaji' && reading) {
      return reading;
    }
    return text;
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">
        {readingMode === 'romaji' ? 'raiburari' : 'ライブラリ'}
      </h2>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {library.length === 0 && (
          <p className="text-sm text-gray-400 px-2">
            {readingMode === 'romaji' ? 'kyoku wo tsuika shite kudasai' : '曲を追加してください'}
          </p>
        )}
        {library.map((song) => (
          <div
            key={song.id}
            className={`group relative mb-2 p-3 rounded-lg cursor-pointer transition ${
              activeId === song.id
                ? 'bg-gray-800 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-800'
            }`}
            onClick={() => onSelect(song)}
          >
            <div className="font-medium text-sm truncate pr-6">
              {getDisplayText(song.title, song.titleReading)}
            </div>
            <div
              className={`text-xs truncate ${
                activeId === song.id ? 'text-gray-300' : 'text-gray-500'
              }`}
            >
              {getDisplayText(song.artist, song.artistReading)}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(song.id);
              }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 transition text-xs px-2 py-1 rounded ${
                activeId === song.id
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              } opacity-100 md:opacity-0 md:group-hover:opacity-100`}
            >
              {readingMode === 'romaji' ? 'sakujo' : '削除'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
