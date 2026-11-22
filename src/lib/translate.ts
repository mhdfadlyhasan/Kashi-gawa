const TIMEOUT_MS = 6000;
const PROXY_STORAGE_KEY = 'kashi-gawa-deepl-proxy';
const cache = new Map<string, string>();

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Translation request failed (${response.status})`);
  return response.json();
}

function getDeepLProxyUrl(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(PROXY_STORAGE_KEY)?.trim();
      if (stored) return stored;
    }
  } catch {
    // Ignore storage access failures.
  }
  const fromEnv = import.meta.env.VITE_DEEPL_PROXY_URL;
  return typeof fromEnv === 'string' ? fromEnv.trim() : '';
}

async function translateWithDeepL(text: string, signal: AbortSignal): Promise<string | null> {
  const proxyUrl = getDeepLProxyUrl();
  if (!proxyUrl) return null;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sourceLang: 'JA', targetLang: 'EN-US' }),
    signal,
  });
  if (!response.ok) throw new Error(`DeepL proxy failed (${response.status})`);

  const data = (await response.json()) as { translation?: unknown } | null;
  const translation = data?.translation;
  return typeof translation === 'string' && translation.trim() ? translation.trim() : null;
}

async function translateWithMyMemory(text: string, signal: AbortSignal): Promise<string | null> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ja%7Cen`;
  const data = (await fetchJson(url, signal)) as {
    responseData?: { translatedText?: unknown };
  } | null;
  const translated = data?.responseData?.translatedText;
  if (typeof translated !== 'string') return null;
  const clean = translated.trim();
  if (!clean || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(clean)) return null;
  return clean;
}

async function translateWithGoogle(text: string, signal: AbortSignal): Promise<string | null> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const data = (await fetchJson(url, signal)) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
  const result = (data[0] as unknown[])
    .map((segment) => (Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : ''))
    .join('')
    .trim();
  return result || null;
}

const inFlight = new Map<string, Promise<string>>();

type Provider = (text: string, signal: AbortSignal) => Promise<string | null>;

const providers: Provider[] = [translateWithDeepL, translateWithMyMemory, translateWithGoogle];

async function attempt(provider: Provider, text: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await provider(text, controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function requestTranslation(trimmed: string): Promise<string> {
  for (const provider of providers) {
    try {
      const result = await attempt(provider, trimmed);
      if (result) {
        cache.set(trimmed, result);
        return result;
      }
    } catch {
      // Try the next provider.
    }
  }
  return '';
}

export async function translateJapanese(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const cached = cache.get(trimmed);
  if (cached) return cached;

  const pending = inFlight.get(trimmed);
  if (pending) return pending;

  const promise = requestTranslation(trimmed);
  inFlight.set(trimmed, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(trimmed);
  }
}
