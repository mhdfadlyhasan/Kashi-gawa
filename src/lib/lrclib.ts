import { LrcLibTrack } from '../types';

const BASE_URL = 'https://lrclib.net/api';

export async function searchTracks(query: string): Promise<LrcLibTrack[]> {
  const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data as LrcLibTrack[];
}

export async function getTrackById(id: number): Promise<LrcLibTrack> {
  const res = await fetch(`${BASE_URL}/get/${id}`);
  const data = await res.json();
  return data as LrcLibTrack;
}
