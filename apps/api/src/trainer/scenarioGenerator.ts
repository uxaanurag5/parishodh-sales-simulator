import { z } from "zod";
import type { LlmProvider } from "../sim/llm/types.js";
import { AI_MODEL_TRAINER } from "../sim/config.js";
import { STAGES } from "./scenarioTemplate.js";

const contentSchema = z.object({
  title: z.string(),
  product: z.string(),
  customerName: z.string(),
  customerInitials: z.string(),
  customerPersona: z.string(),
  requirement: z.string(),
  intent: z.string(),
  preferredColour: z.string(),
  objective: z.string(),
  openingLine: z.string(),
  hiddenFacts: z.record(z.string(), z.string()),
  objections: z.array(z.object({ key: z.string(), stage: z.string(), prompt: z.string() })),
});
export type ScenarioContent = z.infer<typeof contentSchema>;

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
}

function buildSystemPrompt(): string {
  return [
    "You are drafting a sales-call-simulation scenario for a training platform, from a one-paragraph brief a trainer wrote.",
    `The call has these fixed stages, in order:\n${STAGES.map((s) => `- ${s.key}: ${s.label}`).join("\n")}`,
    "Produce: a short title, the product name, an Indian customer name and their 2-letter initials, a 1-2 sentence persona description, the customer's core requirement, their purchase intent (e.g. a timeframe), their key preference (colour/variant/plan — whatever's most relevant to this product), a one-sentence learner objective, the customer's opening line, 3-5 hidden facts as key/value pairs the customer only reveals when relevantly asked, and 2-3 objections the customer raises later, each tied to the HANDLING_DELIVERY_QUESTION or CUSTOMER_OBJECTION stage key, with a short prompt line.",
    'Respond with strict JSON only: {"title":string,"product":string,"customerName":string,"customerInitials":string,"customerPersona":string,"requirement":string,"intent":string,"preferredColour":string,"objective":string,"openingLine":string,"hiddenFacts":{[key:string]:string},"objections":[{"key":string,"stage":string,"prompt":string}]}',
  ].join("\n\n");
}

export async function generateScenarioContent(
  provider: LlmProvider | null,
  brief: string,
  product?: string,
): Promise<ScenarioContent> {
  if (provider) {
    try {
      const raw = await provider.json<unknown>({
        system: buildSystemPrompt(),
        messages: [
          { role: "user", content: `Brief: ${brief}${product ? `\nProduct: ${product}` : ""}` },
        ],
        maxTokens: 700,
        model: AI_MODEL_TRAINER,
      });
      return contentSchema.parse(raw);
    } catch {
      return fallbackContent(brief, product);
    }
  }
  return fallbackContent(brief, product);
}

function fallbackContent(brief: string, product?: string): ScenarioContent {
  const productName = product?.trim() || brief.split(/[.,]/)[0]?.trim() || "the product";
  const customerName = "Neha Kapoor";
  return {
    title: `${productName} Inquiry`,
    product: productName,
    customerName,
    customerInitials: initialsOf(customerName),
    customerPersona: `An Indian customer calling about ${productName}. Decisive and time-pressed, open to discussing options once their core requirement is respected.`,
    requirement: productName,
    intent: "Purchase within 2-3 weeks",
    preferredColour: "Not specified",
    objective: `Understand the customer's requirements for ${productName} and guide them toward a purchase decision.`,
    openingLine: `Hi, I'm interested in ${productName} and wanted to understand my options.`,
    hiddenFacts: {
      budget: "Has a flexible but limited budget in mind",
      decisionTimeline: "Would like to decide within the next couple of weeks",
      priorResearch: "Has already compared a couple of alternatives",
    },
    objections: [
      {
        key: "availability_guarantee",
        stage: "HANDLING_DELIVERY_QUESTION",
        prompt: "Can you guarantee this will be available on my timeline?",
      },
      {
        key: "main_concern",
        stage: "CUSTOMER_OBJECTION",
        prompt: "I'm not fully convinced yet — what makes this the right choice for me?",
      },
    ],
  };
}
