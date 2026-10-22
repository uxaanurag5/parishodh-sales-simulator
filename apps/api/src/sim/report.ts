import { z } from "zod";
import type { CapabilityDimensionDef, Scenario } from "@parishodh/shared";
import type { LlmProvider } from "./llm/types.js";
import type { TranscriptTurn } from "./types.js";
import { AI_MODEL_JUDGMENT } from "./config.js";

// GUIDED mode scores are weighted down for verbatim-reading (CLAUDE.md
// "Modes"): the higher the learner's average adherence to the AI suggestion,
// the more of this many points get shaved off the overall score.
const ADHERENCE_PENALTY_MAX = Number(process.env.GUIDED_VERBATIM_PENALTY_MAX ?? 10);

export function verdictForScore(score: number): string {
  if (score >= 85) return "Sales Ready";
  if (score >= 70) return "Nearly Ready";
  if (score >= 50) return "Needs Coaching";
  return "Not Ready";
}

const dimensionResultSchema = z.object({
  key: z.string(),
  score: z.number().int(),
  evidence: z.string(),
});
const reportResultSchema = z.object({
  dimensions: z.array(dimensionResultSchema),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
});
type ReportResult = z.infer<typeof reportResultSchema>;

export interface ComputedDimension {
  key: string;
  label: string;
  score: number;
  evidence: string;
}

export interface CapabilityReportComputed {
  dimensions: ComputedDimension[];
  overallScore: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
}

function dimensionWeight(scenario: Scenario, dimension: CapabilityDimensionDef): number {
  const weight = dimension.criteriaKeys.reduce((sum, key) => {
    const criterion = scenario.rubric.find((r) => r.criterionKey === key);
    return sum + (criterion?.weight ?? 0);
  }, 0);
  return weight > 0 ? weight : 1;
}

function fallbackDimensionScore(dimension: CapabilityDimensionDef, metCriteriaKeys: Set<string>): number {
  if (dimension.criteriaKeys.length === 0) return 70;
  const metCount = dimension.criteriaKeys.filter((key) => metCriteriaKeys.has(key)).length;
  return Math.round((metCount / dimension.criteriaKeys.length) * 100);
}

function buildFallbackResult(
  scenario: Scenario,
  metCriteriaKeys: Set<string>,
  criterionEvidence: Map<string, string>,
): ReportResult {
  const dimensions = scenario.capabilityDimensions.map((def) => ({
    key: def.key,
    score: fallbackDimensionScore(def, metCriteriaKeys),
    evidence:
      def.criteriaKeys
        .map((key) => criterionEvidence.get(key))
        .filter((e): e is string => Boolean(e))
        .join(" ") || "No AI evaluation available for this call.",
  }));
  const metRubric = scenario.rubric.filter((r) => metCriteriaKeys.has(r.criterionKey));
  const unmetRubric = scenario.rubric.filter((r) => !metCriteriaKeys.has(r.criterionKey));
  return {
    dimensions,
    strengths: metRubric.slice(0, 4).map((r) => r.title),
    improvements: unmetRubric.slice(0, 4).map((r) => r.title),
  };
}

export async function generateCapabilityReport(
  provider: LlmProvider | null,
  scenario: Scenario,
  transcript: TranscriptTurn[],
  metCriteriaKeys: Set<string>,
  criterionEvidence: Map<string, string>,
  averageAdherence: number | null,
): Promise<CapabilityReportComputed> {
  let result: ReportResult;

  if (provider) {
    try {
      const transcriptText = transcript.map((turn) => `${turn.speaker}: ${turn.text}`).join("\n");
      const dimensionList = scenario.capabilityDimensions
        .map((d) => `- ${d.key}: ${d.label} (criteria: ${d.criteriaKeys.join(", ")})`)
        .join("\n");
      const raw = await provider.json<unknown>({
        system: [
          "You are scoring a just-completed sales-call simulation for a training platform.",
          `Scenario objective: ${scenario.objective}`,
          `Score each capability dimension 0-100, with 1-2 lines of evidence quoting the transcript:\n${dimensionList}`,
          "Also list 2-4 strengths and 2-4 areas to improve, as short phrases.",
          'Respond with strict JSON only: {"dimensions":[{"key":string,"score":number,"evidence":string}],"strengths":string[],"improvements":string[]}.',
        ].join("\n\n"),
        messages: [{ role: "user", content: `Full transcript:\n${transcriptText}` }],
        maxTokens: 900,
        model: AI_MODEL_JUDGMENT,
      });
      result = reportResultSchema.parse(raw);
    } catch {
      result = buildFallbackResult(scenario, metCriteriaKeys, criterionEvidence);
    }
  } else {
    result = buildFallbackResult(scenario, metCriteriaKeys, criterionEvidence);
  }

  const dimensions: ComputedDimension[] = scenario.capabilityDimensions.map((def) => {
    const found = result.dimensions.find((d) => d.key === def.key);
    const score = Math.max(0, Math.min(100, found?.score ?? fallbackDimensionScore(def, metCriteriaKeys)));
    return { key: def.key, label: def.label, score, evidence: found?.evidence ?? "" };
  });

  const totalWeight = dimensions.reduce(
    (sum, dim, i) => sum + dimensionWeight(scenario, scenario.capabilityDimensions[i]!),
    0,
  );
  const weightedSum = dimensions.reduce(
    (sum, dim, i) => sum + dim.score * dimensionWeight(scenario, scenario.capabilityDimensions[i]!),
    0,
  );
  let overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  if (scenario.mode === "GUIDED" && averageAdherence !== null) {
    const penalty = Math.round(averageAdherence * ADHERENCE_PENALTY_MAX);
    overallScore = Math.max(0, overallScore - penalty);
  }

  return {
    dimensions,
    overallScore,
    verdict: verdictForScore(overallScore),
    strengths: result.strengths.length > 0 ? result.strengths : ["Completed the simulation"],
    improvements: result.improvements,
  };
}
