import { z } from "zod";
import type { Scenario } from "@parishodh/shared";
import type { LlmProvider } from "./llm/types.js";
import type { TranscriptTurn } from "./types.js";
import { AI_MODEL_JUDGMENT } from "./config.js";

const stageDecisionSchema = z.object({ advance: z.boolean() });

export async function detectStageAdvance(
  provider: LlmProvider | null,
  scenario: Scenario,
  transcript: TranscriptTurn[],
  currentStageIndex: number,
): Promise<boolean> {
  if (currentStageIndex >= scenario.stages.length - 1) return false;

  if (!provider) {
    return ruleBasedAdvance(transcript, currentStageIndex);
  }

  try {
    const recent = transcript
      .slice(-6)
      .map((turn) => `${turn.speaker}: ${turn.text}`)
      .join("\n");
    const result = await provider.json<{ advance: boolean }>({
      system:
        'You decide whether a sales call should move to its next stage. Respond with JSON: {"advance": boolean}.',
      messages: [
        {
          role: "user",
          content: `Current stage: ${scenario.stages[currentStageIndex]!.label}. Next stage: ${scenario.stages[currentStageIndex + 1]!.label}.\n\nRecent conversation:\n${recent}\n\nHas the conversation covered the current stage enough to move on?`,
        },
      ],
      maxTokens: 50,
      model: AI_MODEL_JUDGMENT,
    });
    return stageDecisionSchema.parse(result).advance;
  } catch {
    return ruleBasedAdvance(transcript, currentStageIndex);
  }
}

function ruleBasedAdvance(transcript: TranscriptTurn[], currentStageIndex: number): boolean {
  const turnsInCurrentStage = transcript.filter(
    (turn) => turn.stage === transcript[transcript.length - 1]?.stage,
  ).length;
  return currentStageIndex >= 0 && turnsInCurrentStage >= 4;
}
