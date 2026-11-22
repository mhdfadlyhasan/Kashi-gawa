import { afterEach, describe, expect, it, vi } from 'vitest';
import { translateJapanese } from './translate';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('translateJapanese', () => {
  it('uses the DeepL proxy when configured', async () => {
    vi.stubEnv('VITE_DEEPL_PROXY_URL', 'https://proxy.test/deepl');
    const fetchMock = vi.fn(async (url: string) => {
      void url;
      return new Response(JSON.stringify({ translation: 'DeepL result' }), {
        status: 200,
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(translateJapanese('DeepL test sentence')).resolves.toBe('DeepL result');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://proxy.test/deepl');
  });

  it('falls back to MyMemory when the proxy fails', async () => {
    vi.stubEnv('VITE_DEEPL_PROXY_URL', 'https://proxy.test/deepl');
    const urls: string[] = [];
    const fetchMock = vi.fn(async (url: string) => {
      urls.push(url);
      if (url.startsWith('https://proxy.test')) {
        return new Response('nope', { status: 502 });
      }
      return new Response(JSON.stringify({ responseData: { translatedText: 'MyMemory result' } }), {
        status: 200,
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(translateJapanese('fallback test sentence')).resolves.toBe('MyMemory result');
    expect(urls[0]).toBe('https://proxy.test/deepl');
    expect(urls[1]).toContain('api.mymemory.translated.net');
  });

  it('caches repeated translations', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ responseData: { translatedText: 'cached' } }), {
          status: 200,
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(translateJapanese('cache test sentence')).resolves.toBe('cached');
    await expect(translateJapanese('cache test sentence')).resolves.toBe('cached');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
