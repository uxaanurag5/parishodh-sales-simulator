import type { Scenario as PrismaScenario } from "@prisma/client";
import { scenarioSchema, type Scenario } from "@parishodh/shared";

export function parseScenario(row: PrismaScenario): Scenario {
  return scenarioSchema.parse({
    id: row.id,
    title: row.title,
    product: row.product,
    customerName: row.customerName,
    customerInitials: row.customerInitials,
    customerPersona: row.customerPersona,
    requirement: row.requirement,
    intent: row.intent,
    preferredColour: row.preferredColour,
    objective: row.objective,
    openingLine: row.openingLine,
    hiddenFacts: JSON.parse(row.hiddenFacts),
    objections: JSON.parse(row.objections),
    stages: JSON.parse(row.stages),
    captureDefinitions: JSON.parse(row.captureDefinitions),
    rubric: JSON.parse(row.rubric),
    capabilityDimensions: JSON.parse(row.capabilityDimensions),
    mode: row.mode,
    goldenTranscript: JSON.parse(row.goldenTranscript),
    satisfactionStart: row.satisfactionStart,
  });
}
