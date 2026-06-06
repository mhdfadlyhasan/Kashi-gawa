import { showToast } from '../lib/toast';
import { LrcLibTrack } from '../types';

const BASE_URL = 'https://lrclib.net/api';

export async function searchTracks(query: string): Promise<LrcLibTrack[]> {
  try {
    const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error(`Search failed: ${res.status}`);
    }
    const data = await res.json();
    return data as LrcLibTrack[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    showToast(`Lyrics search failed — ${message}`);
    return [];
  }
}

export async function getTrackById(id: number): Promise<LrcLibTrack | null> {
  try {
    const res = await fetch(`${BASE_URL}/get/${id}`);
    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status}`);
    }
    const data = await res.json();
    return data as LrcLibTrack;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    showToast(`Failed to load song — ${message}`);
    return null;
  }
}
