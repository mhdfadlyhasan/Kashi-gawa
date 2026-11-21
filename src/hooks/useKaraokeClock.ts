import { useCallback, useEffect, useRef, useState } from 'react';

export function useKaraokeClock(durationMs: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const durationRef = useRef(durationMs);

  useEffect(() => {
    durationRef.current = durationMs;
  }, [durationMs]);

  useEffect(() => {
    if (!isPlaying) {
      lastRef.current = null;
      return;
    }

    let frame = 0;
    const tick = (now: number) => {
      if (lastRef.current === null) lastRef.current = now;
      const delta = now - lastRef.current;
      lastRef.current = now;

      elapsedRef.current = Math.min(durationRef.current, elapsedRef.current + delta);
      setElapsedMs(elapsedRef.current);

      if (elapsedRef.current >= durationRef.current) {
        setIsPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      lastRef.current = null;
    };
  }, [isPlaying]);

  const play = useCallback(() => {
    if (durationRef.current > 0 && elapsedRef.current >= durationRef.current) {
      elapsedRef.current = 0;
      setElapsedMs(0);
    }
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => setIsPlaying(false), []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const seek = useCallback((ms: number) => {
    const clamped = Math.max(0, Math.min(durationRef.current || ms, ms));
    elapsedRef.current = clamped;
    setElapsedMs(clamped);
  }, []);

  const restart = useCallback(() => {
    elapsedRef.current = 0;
    setElapsedMs(0);
    setIsPlaying(true);
  }, []);

  return { isPlaying, elapsedMs, play, pause, toggle, seek, restart, ready: true };
}
