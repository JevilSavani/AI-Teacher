/**
 * Browser-native Text-to-Speech (TTS) Service using Web Speech API (window.speechSynthesis).
 * Requires zero external API keys and does not transmit sensitive user data.
 */

const LANGUAGE_CODE_MAP = {
  'English': 'en-US',
  'Spanish': 'es-ES',
  'French': 'fr-FR',
  'German': 'de-DE',
  'Chinese': 'zh-CN',
  'Japanese': 'ja-JP',
  'Korean': 'ko-KR',
  'Italian': 'it-IT',
  'Portuguese': 'pt-BR',
  'Russian': 'ru-RU',
  'Hindi': 'hi-IN'
};

class SpeechService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isSpeakingState = false;
    this.isPausedState = false;
    this.listeners = new Set();
    this.voices = [];

    if (this.synth) {
      this._loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this._loadVoices();
      }
    }
  }

  _loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  isSupported() {
    return !!this.synth;
  }

  getBestVoiceForLanguage(langName) {
    if (!this.synth) return null;
    if (this.voices.length === 0) this._loadVoices();

    const targetLangCode = (LANGUAGE_CODE_MAP[langName] || 'en-US').toLowerCase();
    const shortCode = targetLangCode.split('-')[0];

    // 1. Exact language match (e.g., 'es-ES')
    let matchedVoice = this.voices.find(v => v.lang.toLowerCase() === targetLangCode);
    
    // 2. Short language match (e.g., 'es')
    if (!matchedVoice) {
      matchedVoice = this.voices.find(v => v.lang.toLowerCase().startsWith(shortCode));
    }

    // 3. Fallback to default or first available voice
    if (!matchedVoice) {
      matchedVoice = this.voices.find(v => v.default) || this.voices[0] || null;
    }

    return matchedVoice;
  }

  /**
   * Cleans text before speaking (removes markdown code fences, HTML tags, and raw diagram syntax).
   */
  cleanTextForSpeech(text) {
    if (!text) return '';
    let cleaned = String(text);

    // Remove code blocks ``` ... ```
    cleaned = cleaned.replace(/```[\s\S]*?```/g, ' Code example omitted for clarity. ');
    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    // Remove Markdown headers (# ## ###)
    cleaned = cleaned.replace(/^#+\s*/gm, '');
    // Remove Markdown formatting (** * ` ~)
    cleaned = cleaned.replace(/[\*\*_`~]/g, '');
    // Remove Markdown links [text](url)
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  /**
   * Speaks the provided text in the selected language.
   */
  speak(text, language = 'English', callbacks = {}) {
    if (!this.isSupported()) {
      if (callbacks.onError) callbacks.onError(new Error('Browser SpeechSynthesis is not supported.'));
      return;
    }

    // Always stop any ongoing speech before starting new speech
    this.stop();

    const speakableText = this.cleanTextForSpeech(text);
    if (!speakableText) {
      if (callbacks.onError) callbacks.onError(new Error('No readable text available.'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(speakableText);
    const langCode = LANGUAGE_CODE_MAP[language] || 'en-US';
    utterance.lang = langCode;

    const voice = this.getBestVoiceForLanguage(language);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeakingState = true;
      this.isPausedState = false;
      this._notifyListeners();
      if (callbacks.onStart) callbacks.onStart();
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      this.isPausedState = false;
      this.currentUtterance = null;
      this._notifyListeners();
      if (callbacks.onEnd) callbacks.onEnd();
    };

    utterance.onerror = (event) => {
      // Ignore 'interrupted' or 'canceled' errors caused by calling stop()
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.warn('[SpeechService] TTS error:', event.error);
        if (callbacks.onError) callbacks.onError(new Error(`Speech error: ${event.error}`));
      }
      this.isSpeakingState = false;
      this.isPausedState = false;
      this.currentUtterance = null;
      this._notifyListeners();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  pause() {
    if (this.synth && this.isSpeakingState && !this.isPausedState) {
      this.synth.pause();
      this.isPausedState = true;
      this._notifyListeners();
    }
  }

  resume() {
    if (this.synth && this.isPausedState) {
      this.synth.resume();
      this.isPausedState = false;
      this._notifyListeners();
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeakingState = false;
      this.isPausedState = false;
      this.currentUtterance = null;
      this._notifyListeners();
    }
  }

  isPlaying() {
    return this.isSpeakingState && !this.isPausedState;
  }

  isPaused() {
    return this.isPausedState;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notifyListeners() {
    this.listeners.forEach(fn => fn({
      isPlaying: this.isPlaying(),
      isPaused: this.isPaused(),
      isSpeaking: this.isSpeakingState
    }));
  }
}

export const speechService = new SpeechService();
export default speechService;
