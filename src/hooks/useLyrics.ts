import { useState, useCallback } from 'react';
import { showToast } from '../lib/toast';
import { LrcLibTrack } from '../types';
import { searchTracks, getTrackById } from '../lib/lrclib';

export function useLyrics() {
  const [results, setResults] = useState<LrcLibTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<LrcLibTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const search = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const tracks = await searchTracks(query);
      setResults(tracks);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      showToast(`Search failed — ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectTrack = useCallback(async (id: number) => {
    setIsSelecting(true);
    try {
      const track = await getTrackById(id);
      setCurrentTrack(track);
      setResults([]);
      return track;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      showToast(`Failed to select song — ${message}`);
      return null;
    } finally {
      setIsSelecting(false);
    }
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
