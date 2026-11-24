let cachedJapaneseVoice: SpeechSynthesisVoice | null = null;
let voicesPromise: Promise<SpeechSynthesisVoice | null> | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

export type SpeakFailure = 'unsupported' | 'empty' | 'no-voice' | 'no-output' | 'error';

export type SpeakResult =
  | { ok: true; voice: string; lang: string }
  | { ok: false; reason: SpeakFailure; detail?: string; availableVoices?: string[] };

function pickJapaneseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((voice) => voice.lang.toLowerCase() === 'ja-jp') ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith('ja')) ||
    voices.find((voice) => /japanese|kyoko|otoya|nanami|keita|haruka|ayumi/i.test(voice.name)) ||
    null
  );
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getJapaneseVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) cachedJapaneseVoice = pickJapaneseVoice(voices);
  return cachedJapaneseVoice;
}

function waitForVoices(): Promise<SpeechSynthesisVoice | null> {
  if (!isSpeechSupported()) return Promise.resolve(null);
  const synth = window.speechSynthesis;
  const ready = synth.getVoices();
  if (ready.length > 0) {
    cachedJapaneseVoice = pickJapaneseVoice(ready);
    return Promise.resolve(cachedJapaneseVoice);
  }
  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener('voiceschanged', finish);
      cachedJapaneseVoice = pickJapaneseVoice(synth.getVoices());
      resolve(cachedJapaneseVoice);
    };
    synth.addEventListener('voiceschanged', finish);
    window.setTimeout(finish, 2000);
  });
  return voicesPromise;
}

export async function playJapanese(text: string): Promise<SpeakResult> {
  if (!isSpeechSupported()) return { ok: false, reason: 'unsupported' };
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };

  const synth = window.speechSynthesis;
  let voice = getJapaneseVoice();

  if (synth.getVoices().length === 0) {
    voice = await waitForVoices();
  }

  const voices = synth.getVoices();
  if (voices.length > 0 && !voice) {
    return {
      ok: false,
      reason: 'no-voice',
      availableVoices: voices.map((v) => `${v.name} (${v.lang})`),
    };
  }

  return new Promise<SpeakResult>((resolve) => {
    if (synth.speaking || synth.pending) synth.cancel();

    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    if (voice) utterance.voice = voice;

    let settled = false;
    const settle = (result: SpeakResult) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(watchdog);
      resolve(result);
    };

    const watchdog = window.setTimeout(() => {
      settle({ ok: false, reason: 'no-output' });
    }, 3000);

    utterance.onstart = () => {
      settle({
        ok: true,
        voice: voice?.name ?? 'default',
        lang: utterance.lang,
      });
    };
    utterance.onerror = (event) => {
      settle({ ok: false, reason: 'error', detail: event.error });
    };
    utterance.onend = () => {
      if (currentUtterance === utterance) currentUtterance = null;
    };

    // Keep a strong reference; Chrome drops audio if the utterance is GC'd mid-speech.
    currentUtterance = utterance;
    try {
      synth.speak(utterance);
    } catch (error) {
      settle({ ok: false, reason: 'error', detail: String(error) });
    }
  });
}
