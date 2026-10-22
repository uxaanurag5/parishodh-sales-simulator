import type { Scenario } from "@parishodh/shared";
import type { LlmProvider } from "./llm/types.js";
import type { TranscriptTurn } from "./types.js";
import { AI_MODEL_COACH } from "./config.js";

const FALLBACK_SUGGESTION =
  "Could you tell me a bit more about what you're looking for, so I can find the best option for you?";

export async function generateCoachSuggestion(
  provider: LlmProvider | null,
  scenario: Scenario,
  transcript: TranscriptTurn[],
  stageLabel: string,
  missingCaptureLabels: string[],
): Promise<string> {
  if (!provider) return FALLBACK_SUGGESTION;

  try {
    const recent = transcript
      .slice(-6)
      .map((turn) => `${turn.speaker}: ${turn.text}`)
      .join("\n");
    const result = await provider.json<{ text: string }>({
      system:
        'You are a sales coach. Suggest the single best next line for the salesperson to say, in professional Indian-English sales tone. Never promise an unconfirmed delivery date. Respond with JSON: {"text": string}.',
      messages: [
        {
          role: "user",
          content: `Scenario objective: ${scenario.objective}\nCurrent stage: ${stageLabel}\nStill need to learn: ${missingCaptureLabels.join(", ") || "nothing specific"}\n\nRecent conversation:\n${recent || "(call just started)"}\n\nSuggest the salesperson's next line (1-2 sentences).`,
        },
      ],
      maxTokens: 150,
      model: AI_MODEL_COACH,
    });
    return result.text || FALLBACK_SUGGESTION;
  } catch {
    return FALLBACK_SUGGESTION;
  }
}
