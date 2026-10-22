import type { SttErrorReason, SttProvider } from "./types";

function toErrorReason(error: string): SttErrorReason {
  if (error === "not-allowed" || error === "service-not-allowed") return "permission-denied";
  if (error === "audio-capture") return "no-mic";
  return "other";
}

export class WebSpeechStt implements SttProvider {
  private recognition: SpeechRecognition | null = null;
  private partialListeners = new Set<(text: string) => void>();
  private finalListeners = new Set<(text: string) => void>();
  private errorListeners = new Set<(reason: SttErrorReason) => void>();
  private listening = false;

  isSupported(): boolean {
    return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  private ensureRecognition(): SpeechRecognition | null {
    if (this.recognition) return this.recognition;
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return null;

    const recognition = new Ctor();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]!;
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) final += transcript;
        else interim += transcript;
      }
      if (interim) this.partialListeners.forEach((cb) => cb(interim));
      if (final) this.finalListeners.forEach((cb) => cb(final));
    };
    recognition.onend = () => {
      this.listening = false;
    };
    recognition.onerror = (event) => {
      this.listening = false;
      // "no-speech"/"aborted" are routine (silence, or an intentional stop()) and not
      // worth surfacing as an error to the learner.
      if (event.error === "no-speech" || event.error === "aborted") return;
      const reason = toErrorReason(event.error);
      this.errorListeners.forEach((cb) => cb(reason));
    };

    this.recognition = recognition;
    return recognition;
  }

  start(): void {
    const recognition = this.ensureRecognition();
    if (!recognition || this.listening) return;
    try {
      recognition.start();
      this.listening = true;
    } catch {
      // Recognition was already starting; ignore.
    }
  }

  stop(): void {
    if (!this.recognition || !this.listening) return;
    this.recognition.stop();
    this.listening = false;
  }

  onPartial(cb: (text: string) => void) {
    this.partialListeners.add(cb);
    return () => this.partialListeners.delete(cb);
  }

  onFinal(cb: (text: string) => void) {
    this.finalListeners.add(cb);
    return () => this.finalListeners.delete(cb);
  }

  onError(cb: (reason: SttErrorReason) => void) {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb);
  }
}
