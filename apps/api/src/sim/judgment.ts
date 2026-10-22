import { z } from "zod";
import type { Scenario } from "@parishodh/shared";
import type { LlmProvider } from "./llm/types.js";
import type { TranscriptTurn } from "./types.js";
import { AI_MODEL_JUDGMENT } from "./config.js";

export const judgmentFlagSchema = z.enum([
  "unsupported_promise",
  "pushy",
  "off_topic",
  "vague",
  "none",
]);

const judgmentResultSchema = z.object({
  newCaptures: z.array(z.object({ key: z.string(), value: z.string() })),
  criteria: z.array(z.object({ key: z.string(), met: z.boolean(), evidence: z.string() })),
  satisfactionDelta: z.number().int().min(-15).max(15),
  reason: z.string(),
  flags: z.array(z.string()),
});
export type JudgmentResult = z.infer<typeof judgmentResultSchema>;

const EMPTY_RESULT: JudgmentResult = {
  newCaptures: [],
  criteria: [],
  satisfactionDelta: 0,
  reason: "",
  flags: [],
};

/**
 * Deterministic keyword/regex capture detection so the UI can react before
 * (or without) an LLM round trip. The LLM pass below confirms or corrects
 * these, and the caller is responsible for deduping against what's already
 * been captured.
 */
export function ruleBasedCaptures(
  scenario: Scenario,
  learnerText: string,
  customerText: string,
): { key: string; value: string }[] {
  const hits: { key: string; value: string }[] = [];
  const definedKeys = new Set(scenario.captureDefinitions.map((d) => d.key));
  const combined = `${customerText} ${learnerText}`.toLowerCase();
  const learnerLower = learnerText.toLowerCase();

  function add(key: string, value: string) {
    if (definedKeys.has(key)) hits.push({ key, value });
  }

  if (/\bev ?9s\b/.test(combined)) add("vehicle_identified", "EV 9S");

  const weeksMatch = combined.match(/(\d+)\s*week/);
  if (/\bwhite\b/.test(combined) && weeksMatch) {
    add("colour_timeline", `White · ${weeksMatch[1]} wks`);
  }

  if (/(higher|top).{0,15}variant|all.?the.?features/.test(combined)) {
    add("variant_discovered", "Higher, loaded");
  }

  if (/flexib(le|ility)/.test(learnerLower)) add("timeline_probed", "Flexibility");

  if (/replac\w*.{0,20}(suv|existing|vehicle|car)/.test(combined)) {
    add("need_identified", "Replacing SUV");
  }

  if (/\b(financ\w*|loan|emi)\b/.test(combined)) add("qualification", "Part-finance");

  if (/(keep white|white.{0,15}(primary|requirement|kept)|won'?t compromise)/.test(combined)) {
    add("objection_handled", "White kept");
  }

  if (/(follow.?up|get back|come back|reach out)/.test(learnerLower)) {
    add("next_step_agreed", "Follow-up");
  }

  return hits;
}

/** A confirmed delivery promise with no hedging -- the thing the rubric explicitly penalizes. */
export function detectUnsupportedPromise(learnerText: string): boolean {
  const text = learnerText.toLowerCase();
  const promises = /(i (can |will )?guarantee|guaranteed|definitely|100%|promise you|assured)/;
  const hedges = /(check|confirm|once i|after i|subject to|realistic|availability)/;
  return promises.test(text) && !hedges.test(text);
}

function buildSystemPrompt(scenario: Scenario, remainingCaptures: string, remainingCriteria: string): string {
  return [
    "You are the Judgment Engine for a sales-training phone-call simulator. After the learner's most recent turn, score what just happened.",
    `Capture definitions still to find:\n${remainingCaptures || "(all already captured)"}`,
    `Rubric criteria still to assess:\n${remainingCriteria || "(all already assessed)"}`,
    'Rules:',
    "- Only report a capture in newCaptures if the transcript now clearly supports it; keep values short (at most 3 words), like \"EV 9S\" or \"White · 3 wks\".",
    '- Report "no_unsupported_promise" captured only if the learner was asked for a guarantee and explicitly declined to give an unconfirmed one.',
    "- If the learner promised a delivery date/timeframe without confirming availability first, add the flag \"unsupported_promise\" and mark the delivery_handling criterion as met:false with evidence.",
    "- satisfactionDelta is how much the simulated customer's satisfaction should move after this exchange, from -15 (frustrated) to +15 (delighted). Small, realistic moves most turns.",
    "- flags is a short list from: unsupported_promise, pushy, off_topic, vague, or empty.",
    `Respond with strict JSON only: {"newCaptures":[{"key":string,"value":string}],"criteria":[{"key":string,"met":boolean,"evidence":string}],"satisfactionDelta":number,"reason":string,"flags":string[]}. Scenario objective: ${scenario.objective}`,
  ].join("\n\n");
}

export async function evaluateTurn(
  provider: LlmProvider | null,
  scenario: Scenario,
  transcript: TranscriptTurn[],
  capturedKeys: Set<string>,
  metCriteriaKeys: Set<string>,
): Promise<JudgmentResult> {
  const lastLearner = [...transcript].reverse().find((t) => t.speaker === "LEARNER");
  const ruleHits = ruleBasedCaptures(
    scenario,
    lastLearner?.text ?? "",
    transcript[transcript.length - 1]?.text ?? "",
  ).filter((hit) => !capturedKeys.has(hit.key));

  if (!provider) {
    return { ...EMPTY_RESULT, newCaptures: ruleHits, reason: "rule-based (no AI provider configured)" };
  }

  const remainingCaptures = scenario.captureDefinitions
    .filter((def) => !capturedKeys.has(def.key))
    .map((def) => `- ${def.key}: ${def.label} — ${def.description}`)
    .join("\n");
  const remainingCriteria = scenario.rubric
    .filter((c) => !metCriteriaKeys.has(c.criterionKey))
    .map((c) => `- ${c.criterionKey}: ${c.title} — ${c.question}`)
    .join("\n");

  try {
    const recent = transcript
      .slice(-8)
      .map((turn) => `${turn.speaker}: ${turn.text}`)
      .join("\n");
    const raw = await provider.json<unknown>({
      system: buildSystemPrompt(scenario, remainingCaptures, remainingCriteria),
      messages: [{ role: "user", content: `Transcript so far:\n${recent}` }],
      maxTokens: 500,
      model: AI_MODEL_JUDGMENT,
    });
    const parsed = judgmentResultSchema.parse(raw);

    for (const hit of ruleHits) {
      if (!parsed.newCaptures.some((c) => c.key === hit.key)) parsed.newCaptures.push(hit);
    }
    return parsed;
  } catch {
    return { ...EMPTY_RESULT, newCaptures: ruleHits, reason: "judgment call failed, used rule-based fallback" };
  }
}
