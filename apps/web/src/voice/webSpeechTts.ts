import type { TtsProvider, TtsVoiceOptions } from "./types";

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return undefined;
  const enIN = voices.filter((v) => v.lang.toLowerCase().startsWith("en-in"));
  const male = enIN.find((v) => /male/i.test(v.name));
  return male ?? enIN[0] ?? voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2))) ?? voices[0];
}

export class WebSpeechTts implements TtsProvider {
  private levelListeners = new Set<(level: number) => void>();
  private boundaryListeners = new Set<(charIndex: number) => void>();
  private endListeners = new Set<() => void>();
  private pulseTimer: ReturnType<typeof setTimeout> | null = null;

  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  speak(text: string, options: TtsVoiceOptions = {}): void {
    if (!this.isSupported()) return;
    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang ?? "en-IN";
    const voice = pickVoice(utterance.lang);
    if (voice) utterance.voice = voice;

    utterance.onboundary = (event) => {
      this.boundaryListeners.forEach((cb) => cb(event.charIndex));
      this.pulse();
    };
    utterance.onend = () => {
      this.stopPulsing();
      this.endListeners.forEach((cb) => cb());
    };
    utterance.onerror = () => {
      this.stopPulsing();
      this.endListeners.forEach((cb) => cb());
    };

    window.speechSynthesis.speak(utterance);
  }

  cancel(): void {
    this.stopPulsing();
    if (this.isSupported()) window.speechSynthesis.cancel();
  }

  private pulse() {
    this.levelListeners.forEach((cb) => cb(0.6 + Math.random() * 0.4));
    if (this.pulseTimer) clearTimeout(this.pulseTimer);
    this.pulseTimer = setTimeout(() => {
      this.levelListeners.forEach((cb) => cb(0.15));
    }, 150);
  }

  private stopPulsing() {
    if (this.pulseTimer) clearTimeout(this.pulseTimer);
    this.pulseTimer = null;
    this.levelListeners.forEach((cb) => cb(0));
  }

  onLevel(cb: (level: number) => void) {
    this.levelListeners.add(cb);
    return () => this.levelListeners.delete(cb);
  }

  onBoundary(cb: (charIndex: number) => void) {
    this.boundaryListeners.add(cb);
    return () => this.boundaryListeners.delete(cb);
  }

  onEnd(cb: () => void) {
    this.endListeners.add(cb);
    return () => this.endListeners.delete(cb);
  }
}
