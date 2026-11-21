import React, { useEffect, useRef, useState } from 'react';
import { useKaraokeClock } from '../hooks/useKaraokeClock';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';

interface KaraokeBarProps {
  durationMs: number;
  youtubeId?: string;
  youtubeOffsetMs?: number;
  onElapsedChange: (ms: number) => void;
  onSetYouTube: (input: string) => void;
  onOffsetChange: (ms: number) => void;
  onClose: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const KaraokeBar: React.FC<KaraokeBarProps> = ({
  durationMs,
  youtubeId,
  youtubeOffsetMs = 0,
  onElapsedChange,
  onSetYouTube,
  onOffsetChange,
  onClose,
}) => {
  const virtual = useKaraokeClock(durationMs);
  const youtube = useYouTubePlayer(youtubeId ?? null, youtubeOffsetMs);
  const usingYouTube = Boolean(youtubeId);

  const elapsedMs = usingYouTube ? youtube.elapsedMs : virtual.elapsedMs;
  const isPlaying = usingYouTube ? youtube.isPlaying : virtual.isPlaying;
  const ready = usingYouTube ? youtube.ready : true;

  const play = usingYouTube ? youtube.play : virtual.play;
  const pause = usingYouTube ? youtube.pause : virtual.pause;
  const seek = usingYouTube ? youtube.seek : virtual.seek;
  const restart = usingYouTube ? youtube.restart : virtual.restart;

  const [linkInput, setLinkInput] = useState('');
  const [playerOpen, setPlayerOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onElapsedChange(elapsedMs);
  }, [elapsedMs, onElapsedChange]);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(document.fullscreenElement === playerContainerRef.current);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    setPlayerOpen(true);
    container.requestFullscreen?.().catch(() => {});
  };

  return (
    <div className="border-t border-gray-200 pt-2 mt-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => (isPlaying ? pause() : play())}
          disabled={!ready}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={restart}
          disabled={!ready}
          className="flex-shrink-0 p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
          aria-label="Restart"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v6h6M20 20v-6h-6M5.5 9a7 7 0 0112.4-1M18.5 15a7 7 0 01-12.4 1"
            />
          </svg>
        </button>

        <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
          {formatTime(elapsedMs)} / {formatTime(durationMs)}
        </span>

        <input
          type="range"
          min={0}
          max={Math.max(durationMs, 1)}
          value={Math.min(elapsedMs, Math.max(durationMs, 1))}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={!ready}
          className="flex-1 min-w-0 accent-gray-800"
          aria-label="Seek"
        />

        <span
          className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded-full border ${
            usingYouTube
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}
        >
          {usingYouTube ? 'YouTube' : 'Timer'}
        </span>

        <button
          onClick={onClose}
          className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
          aria-label="Exit karaoke mode"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-2">
        <form
          className="flex items-center gap-1 min-w-0"
          onSubmit={(e) => {
            e.preventDefault();
            onSetYouTube(linkInput);
          }}
        >
          <input
            type="text"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Paste YouTube link (optional)"
            className="w-48 md:w-64 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <button
            type="submit"
            className="px-2 py-1 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Set
          </button>
          {usingYouTube && (
            <button
              type="button"
              onClick={() => {
                setLinkInput('');
                onSetYouTube('');
              }}
              className="px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Clear
            </button>
          )}
        </form>

        {usingYouTube && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span className="hidden sm:inline">Sync</span>
            <button
              onClick={() => onOffsetChange(youtubeOffsetMs - 500)}
              className="px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              -0.5s
            </button>
            <span className="tabular-nums w-12 text-center">
              {(youtubeOffsetMs / 1000).toFixed(1)}s
            </span>
            <button
              onClick={() => onOffsetChange(youtubeOffsetMs + 500)}
              className="px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              +0.5s
            </button>
            <button
              onClick={() => onOffsetChange(0)}
              className="px-2 py-1 text-gray-400 hover:text-gray-700 transition"
            >
              reset
            </button>
            <button
              onClick={() => setPlayerOpen((prev) => !prev)}
              className="ml-1 px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              {playerOpen ? 'Hide video' : 'Show video'}
            </button>
            <button
              onClick={toggleFullscreen}
              className="px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </button>
          </div>
        )}
      </div>

      {usingYouTube && !ready && (
        <p className={`mt-1 text-[11px] ${youtube.error ? 'text-red-500' : 'text-gray-400'}`}>
          {youtube.error
            ? 'YouTube player unavailable. Clear the link to use the timer.'
            : 'Loading YouTube player…'}
        </p>
      )}

      {usingYouTube && (
        <div
          ref={playerContainerRef}
          className={`overflow-hidden bg-black transition-all ${
            isFullscreen
              ? 'mt-0 flex h-screen w-screen items-center justify-center rounded-none'
              : playerOpen
                ? 'mt-2 w-full max-w-sm aspect-video rounded-lg'
                : 'mt-0 h-0 w-0'
          }`}
        >
          <div
            ref={youtube.wrapperRef}
            className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full"
          />
        </div>
      )}
    </div>
  );
};
