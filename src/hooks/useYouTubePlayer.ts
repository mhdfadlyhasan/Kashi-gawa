import { useCallback, useEffect, useRef, useState } from 'react';
import { loadYouTubeApi } from '../lib/youtube';

export function useYouTubePlayer(videoId: string | null, offsetMs: number) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const offsetRef = useRef(offsetMs);
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    offsetRef.current = offsetMs;
  }, [offsetMs]);

  useEffect(() => {
    if (!videoId) {
      setReady(false);
      setIsPlaying(false);
      setError(false);
      return;
    }

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let cancelled = false;
    let player: YouTubePlayer | null = null;
    setError(false);
    const host = document.createElement('div');
    wrapper.replaceChildren(host);

    loadYouTubeApi()
      .then(() => {
        if (cancelled) return;
        const YT = window.YT;
        if (!YT) {
          setError(true);
          return;
        }

        player = new YT.Player(host, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: { playsinline: 1, rel: 0 },
          events: {
            onReady: () => {
              if (!cancelled) setReady(true);
            },
            onStateChange: (event) => {
              if (!cancelled) setIsPlaying(event.data === YT.PlayerState.PLAYING);
            },
          },
        });
        playerRef.current = player;
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      try {
        player?.destroy();
      } catch {
        // The iframe may already be gone.
      }
      playerRef.current = null;
      wrapper.replaceChildren();
      setReady(false);
      setIsPlaying(false);
      setError(false);
    };
  }, [videoId]);

  useEffect(() => {
    if (!videoId) return;

    let frame = 0;
    let lastUpdate = 0;
    const tick = (now: number) => {
      const player = playerRef.current;
      if (player && typeof player.getCurrentTime === 'function') {
        const seconds = player.getCurrentTime();
        if (Number.isFinite(seconds) && now - lastUpdate >= 33) {
          lastUpdate = now;
          setElapsedMs(Math.max(0, seconds * 1000 + offsetRef.current));
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [videoId]);

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const seek = useCallback((ms: number) => {
    const targetSeconds = Math.max(0, (ms - offsetRef.current) / 1000);
    playerRef.current?.seekTo(targetSeconds, true);
    setElapsedMs(Math.max(0, ms));
  }, []);

  const restart = useCallback(() => {
    seek(0);
    playerRef.current?.playVideo();
  }, [seek]);

  return { wrapperRef, ready, error, isPlaying, elapsedMs, play, pause, seek, restart };
}
