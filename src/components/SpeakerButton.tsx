import React, { useState } from 'react';
import { isSpeechSupported, playJapanese } from '../lib/audio';
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
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isPlaying) return;

    if (!isSpeechSupported()) {
      showToast('This browser does not support speech playback');
      return;
    }

    setIsPlaying(true);
    const result = await playJapanese(text);
    setIsPlaying(false);

    if (result.ok) return;

    switch (result.reason) {
      case 'empty':
        showToast('Nothing to pronounce');
        break;
      case 'no-voice':
        showToast('No Japanese voice found — install or enable one in your system settings');
        break;
      case 'no-output':
        showToast('Speech did not play — no Japanese voice or audio output available');
        break;
      case 'error':
        showToast(`Speech failed: ${result.detail ?? 'unknown error'}`);
        break;
      default:
        showToast('Speech playback is not supported in this browser');
    }
  };

  return (
    <button
      type="button"
      onClick={(event) => void handleClick(event)}
      disabled={isPlaying}
      className={`p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition flex-shrink-0 disabled:opacity-50 ${className}`}
      title={title}
      aria-label={title}
    >
      <svg
        className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`}
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
