export interface JishoResult {
  japanese: { word: string; reading: string }[];
  senses: { english_definitions: string[]; parts_of_speech: string[] }[];
}

export async function searchJisho(word: string): Promise<JishoResult | null> {
  const res = await fetch(
    `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`
  );
  const data = await res.json();
  if (!data.data || data.data.length === 0) return null;
  const first = data.data[0];
  return {
    japanese: first.japanese || [],
    senses: first.senses || [],
  };
}
