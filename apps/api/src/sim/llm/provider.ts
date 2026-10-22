import type { LlmProvider } from "./types.js";
import { AnthropicProvider } from "./anthropic.js";

export function buildProvider(): LlmProvider | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.AI_MODEL;
  if (!apiKey || !model) return null;
  return new AnthropicProvider(apiKey, model);
}
