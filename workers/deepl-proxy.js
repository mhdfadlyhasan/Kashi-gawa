const FREE_ENDPOINT = 'https://api-free.deepl.com/v2/translate';
const PRO_ENDPOINT = 'https://api.deepl.com/v2/translate';
const MAX_TEXT_LENGTH = 4000;

function corsHeaders(request, allowedOrigin) {
  const origin = request.headers.get('Origin') || '';
  let allowOrigin = '*';
  if (allowedOrigin && allowedOrigin !== '*') {
    allowOrigin = origin === allowedOrigin ? origin : '';
  }
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (allowOrigin) headers['Access-Control-Allow-Origin'] = allowOrigin;
  return headers;
}

function json(payload, status, headers) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env.ALLOWED_ORIGIN);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, headers);
    }

    if (env.ALLOWED_ORIGIN && env.ALLOWED_ORIGIN !== '*') {
      const origin = request.headers.get('Origin') || '';
      if (origin !== env.ALLOWED_ORIGIN) {
        return json({ error: 'Origin not allowed' }, 403, headers);
      }
    }

    if (!env.DEEPL_API_KEY) {
      return json({ error: 'Server is missing DEEPL_API_KEY' }, 500, headers);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, headers);
    }

    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return json({ error: 'Missing text' }, 400, headers);
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return json({ error: 'Text too long' }, 400, headers);
    }

    const sourceLang =
      typeof body?.sourceLang === 'string' && body.sourceLang ? body.sourceLang : 'JA';
    const targetLang =
      typeof body?.targetLang === 'string' && body.targetLang ? body.targetLang : 'EN-US';
    const endpoint = env.DEEPL_API_KEY.endsWith(':fx') ? FREE_ENDPOINT : PRO_ENDPOINT;

    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [text],
          source_lang: sourceLang,
          target_lang: targetLang,
        }),
      });
    } catch {
      return json({ error: 'DeepL request failed' }, 502, headers);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return json(
        { error: `DeepL error (${response.status})`, detail: detail.slice(0, 300) },
        502,
        headers
      );
    }

    const data = await response.json().catch(() => null);
    const translation = data?.translations?.[0]?.text;
    if (typeof translation !== 'string') {
      return json({ error: 'Unexpected DeepL response' }, 502, headers);
    }

    return json({ translation }, 200, headers);
  },
};
