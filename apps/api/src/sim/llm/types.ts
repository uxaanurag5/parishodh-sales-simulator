export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmStreamOptions {
  system: string;
  messages: LlmMessage[];
  maxTokens?: number;
  /** Overrides the provider's default model for this call (per-role cost control). */
  model?: string;
}

export type LlmJsonOptions = LlmStreamOptions;

export interface LlmProvider {
  stream(options: LlmStreamOptions, onDelta: (delta: string) => void): Promise<string>;
  json<T>(options: LlmJsonOptions): Promise<T>;
}
