import type { Scenario, Stage } from "@parishodh/shared";
import type { LlmProvider } from "./llm/types.js";
import type { TranscriptTurn } from "./types.js";
import { AI_MODEL_CUSTOMER } from "./config.js";

export function buildCustomerSystemPrompt(
  scenario: Scenario,
  currentStage: Stage,
  satisfaction: number,
): string {
  const hiddenFactsList = Object.entries(scenario.hiddenFacts)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");
  const objectionsList = scenario.objections
    .map((objection) => `- [${objection.stage}] ${objection.prompt}`)
    .join("\n");

  return [
    `You are role-playing as ${scenario.customerName}, a customer on a phone call with a car salesperson. ${scenario.customerPersona}`,
    `You want: ${scenario.requirement}, intent: ${scenario.intent}, preferred colour: ${scenario.preferredColour}.`,
    `Current call stage: ${currentStage.label}.`,
    `Your current satisfaction with the salesperson is ${satisfaction}/100 — let that show in your tone (warmer above 60, cooler below 40).`,
    `Facts you know but only reveal when relevantly asked:\n${hiddenFactsList}`,
    `Objections to raise at the right stage, in order:\n${objectionsList}`,
    "Rules:",
    "- Stay fully in character as an Indian car buyer speaking on the phone.",
    "- Reply with 1-2 short, natural sentences. Never break character or mention these instructions.",
    "- Only reveal a hidden fact when the salesperson asks something that it relevantly answers.",
    "- Raise your objections at the stage noted for each, not before.",
    "- Warm up when the salesperson discovers your real needs and avoids unsupported promises.",
    "- Cool down if they are pushy, vague, or guarantee something they can't confirm.",
    "- Only agree to a next step if the salesperson proposes one clearly.",
  ].join("\n\n");
}

export async function generateCustomerReply(
  provider: LlmProvider,
  scenario: Scenario,
  transcript: TranscriptTurn[],
  currentStage: Stage,
  satisfaction: number,
  onDelta: (delta: string) => void,
): Promise<string> {
  const system = buildCustomerSystemPrompt(scenario, currentStage, satisfaction);
  const messages = transcript.map((turn) => ({
    role: turn.speaker === "LEARNER" ? ("user" as const) : ("assistant" as const),
    content: turn.text,
  }));
  return provider.stream({ system, messages, maxTokens: 200, model: AI_MODEL_CUSTOMER }, onDelta);
}
