import React from 'react';
import { DetailMode } from '../hooks/useDetailMode';

interface DetailModeToggleProps {
  detailMode: DetailMode;
  onChange: (mode: DetailMode) => void;
}

export const DetailModeToggle: React.FC<DetailModeToggleProps> = ({
  detailMode,
  onChange,
}) => {
  const modes: { value: DetailMode; label: string }[] = [
    { value: 'popup', label: 'Popup' },
    { value: 'compact', label: 'Compact' },
  ];

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onChange(mode.value)}
          className={`flex-1 px-2 py-1 md:px-3 text-xs md:text-sm rounded-md transition whitespace-nowrap ${
            detailMode === mode.value
              ? 'bg-white text-gray-900 shadow-sm font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
};
