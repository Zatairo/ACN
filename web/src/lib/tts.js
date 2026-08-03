let cachedVoices = [];
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  cachedVoices = window.speechSynthesis.getVoices();
}

export const ACCENT_LANG = {
  us: 'en-US',
  uk: 'en-GB',
  aus: 'en-AU',
};

export function speakWithAccent(text, accent = 'us') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  window.speechSynthesis.cancel();
  const clean = String(text).replace(/\[pause\]/g, '. ').replace(/\*/g, '').replace(/\[\/?[^]]+\]/g, '');
  const utterance = new SpeechSynthesisUtterance(clean);
  const lang = ACCENT_LANG[accent] || 'en-US';
  utterance.lang = lang;
  const voices = cachedVoices.length ? cachedVoices : window.speechSynthesis.getVoices();
  const voice =
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang?.startsWith(lang.slice(0, 2)));
  if (voice) utterance.voice = voice;
  utterance.rate = 0.85;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}