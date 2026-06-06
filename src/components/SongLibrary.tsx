import React from 'react';
import { LibraryItem } from '../types';

interface SongLibraryProps {
  library: LibraryItem[];
  activeId: number | null;
  onSelect: (song: LibraryItem) => void;
  onRemove: (id: number) => void;
}

export const SongLibrary: React.FC<SongLibraryProps> = ({
  library,
  activeId,
  onSelect,
  onRemove,
}) => {
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">ライブラリ</h2>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {library.length === 0 && (
          <p className="text-sm text-gray-400 px-2">曲を追加してください</p>
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
            <div className="font-medium text-sm truncate pr-6">{song.title}</div>
            <div
              className={`text-xs truncate ${
                activeId === song.id ? 'text-gray-300' : 'text-gray-500'
              }`}
            >
              {song.artist}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(song.id);
              }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition text-xs px-2 py-1 rounded ${
                activeId === song.id
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
