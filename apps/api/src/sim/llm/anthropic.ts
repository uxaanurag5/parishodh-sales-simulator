import Anthropic from "@anthropic-ai/sdk";
import type { LlmJsonOptions, LlmProvider, LlmStreamOptions } from "./types.js";

const CALL_TIMEOUT_MS = Number(process.env.AI_CALL_TIMEOUT_MS ?? 15000);

function extractText(content: { type: string; text?: string }[]): string {
  return content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

export class AnthropicProvider implements LlmProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async stream(options: LlmStreamOptions, onDelta: (delta: string) => void): Promise<string> {
    const stream = this.client.messages.stream({
      model: options.model ?? this.model,
      max_tokens: options.maxTokens ?? 300,
      system: options.system,
      messages: options.messages,
    });
    stream.on("text", (delta) => onDelta(delta));
    const final = await withTimeout(stream.finalMessage(), CALL_TIMEOUT_MS, "AI stream call");
    return extractText(final.content);
  }

  async json<T>(options: LlmJsonOptions): Promise<T> {
    try {
      return await this.callJsonOnce<T>(options);
    } catch {
      // One retry before the caller's own fallback kicks in (CLAUDE.md:
      // "On a validation failure, retry once, then fall back gracefully").
      return await this.callJsonOnce<T>(options);
    }
  }

  private async callJsonOnce<T>(options: LlmJsonOptions): Promise<T> {
    const message = await withTimeout(
      this.client.messages.create({
        model: options.model ?? this.model,
        max_tokens: options.maxTokens ?? 500,
        system: `${options.system}\n\nRespond with JSON only. No prose, no markdown code fences.`,
        messages: options.messages,
      }),
      CALL_TIMEOUT_MS,
      "AI JSON call",
    );
    const text = extractText(message.content);
    return JSON.parse(text) as T;
  }
}
