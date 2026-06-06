import { useState, useCallback } from 'react';
import { LrcLibTrack } from '../types';
import { searchTracks, getTrackById } from '../lib/lrclib';

export function useLyrics() {
  const [results, setResults] = useState<LrcLibTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<LrcLibTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const search = useCallback(async (query: string) => {
    setIsLoading(true);
    const tracks = await searchTracks(query);
    setResults(tracks);
    setIsLoading(false);
  }, []);

  const selectTrack = useCallback(async (id: number) => {
    setIsSelecting(true);
    const track = await getTrackById(id);
    setCurrentTrack(track);
    setResults([]);
    setIsSelecting(false);
    return track;
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    results,
    currentTrack,
    isLoading,
    isSelecting,
    search,
    selectTrack,
    clearResults,
  };
}
