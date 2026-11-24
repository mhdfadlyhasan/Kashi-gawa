let cachedJapaneseVoice: SpeechSynthesisVoice | null = null;
let voiceListenerAttached = false;

function pickJapaneseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((voice) => voice.lang.toLowerCase() === 'ja-jp') ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith('ja')) ||
    null
  );
}

function ensureVoices(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  const update = () => {
    const voices = synth.getVoices();
    if (voices.length > 0) cachedJapaneseVoice = pickJapaneseVoice(voices);
  };
  update();
  if (!voiceListenerAttached) {
    synth.addEventListener('voiceschanged', update);
    voiceListenerAttached = true;
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakJapanese(text: string): boolean {
  if (!isSpeechSupported()) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  const synth = window.speechSynthesis;
  ensureVoices();
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.9;
  if (cachedJapaneseVoice) utterance.voice = cachedJapaneseVoice;
  synth.speak(utterance);
  return true;
}
