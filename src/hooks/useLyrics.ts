import { useState, useCallback } from 'react';
import { LrcLibTrack } from '../types';
import { searchTracks, getTrackById } from '../lib/lrclib';

export function useLyrics() {
  const [results, setResults] = useState<LrcLibTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<LrcLibTrack | null>(null);

  const search = useCallback(async (query: string) => {
    const tracks = await searchTracks(query);
    setResults(tracks);
  }, []);

  const selectTrack = useCallback(async (id: number) => {
    const track = await getTrackById(id);
    setCurrentTrack(track);
    setResults([]);
    return track;
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    results,
    currentTrack,
    search,
    selectTrack,
    clearResults,
  };
}
