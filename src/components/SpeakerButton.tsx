import React from 'react';
import { isSpeechSupported, speakJapanese } from '../lib/audio';
import { showToast } from '../lib/toast';

interface SpeakerButtonProps {
  text: string;
  className?: string;
  title?: string;
}

export const SpeakerButton: React.FC<SpeakerButtonProps> = ({
  text,
  className = '',
  title = 'Play pronunciation',
}) => {
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isSpeechSupported()) {
      showToast('Pronunciation playback is not supported in this browser');
      return;
    }
    if (!speakJapanese(text)) {
      showToast('Nothing to pronounce');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition flex-shrink-0 ${className}`}
      title={title}
      aria-label={title}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H3v6h3l5 4V5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a5 5 0 010 7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 5.5a9 9 0 010 13" />
      </svg>
    </button>
  );
};
