export type SttErrorReason = "permission-denied" | "no-mic" | "other";

export interface SttProvider {
  start(): void;
  stop(): void;
  /** Interim (not-yet-final) recognition results. Returns an unsubscribe fn. */
  onPartial(cb: (text: string) => void): () => void;
  /** A completed phrase. Returns an unsubscribe fn. */
  onFinal(cb: (text: string) => void): () => void;
  /** Recognition failed to start or was cut off (e.g. mic permission denied). */
  onError(cb: (reason: SttErrorReason) => void): () => void;
  isSupported(): boolean;
}

export interface TtsVoiceOptions {
  lang?: string;
}

export interface TtsProvider {
  speak(text: string, options?: TtsVoiceOptions): void;
  cancel(): void;
  /** Pseudo audio-level in [0, 1], for driving a waveform. */
  onLevel(cb: (level: number) => void): () => void;
  /** Fires near each spoken word with its character offset into the text. */
  onBoundary(cb: (charIndex: number) => void): () => void;
  onEnd(cb: () => void): () => void;
  isSupported(): boolean;
}
