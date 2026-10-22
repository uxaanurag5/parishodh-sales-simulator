import { describe, expect, it } from "vitest";
import type { Scenario } from "@parishodh/shared";
import { generateCapabilityReport, verdictForScore } from "./report.js";

describe("verdictForScore", () => {
  it.each([
    [100, "Sales Ready"],
    [85, "Sales Ready"],
    [84, "Nearly Ready"],
    [70, "Nearly Ready"],
    [69, "Needs Coaching"],
    [50, "Needs Coaching"],
    [49, "Not Ready"],
    [0, "Not Ready"],
  ])("maps a score of %i to %s", (score, expected) => {
    expect(verdictForScore(score)).toBe(expected);
  });
});

function buildScenario(mode: Scenario["mode"]): Scenario {
  return {
    objective: "Qualify the customer and move toward a purchase decision.",
    mode,
    rubric: [
      { criterionKey: "c1", title: "Discovered the need", question: "", weight: 1 },
      { criterionKey: "c2", title: "Closed with a next step", question: "", weight: 1 },
    ],
    capabilityDimensions: [
      { key: "discovery", label: "Discovery", criteriaKeys: ["c1"] },
      { key: "closing", label: "Closing", criteriaKeys: ["c2"] },
    ],
  } as unknown as Scenario;
}

describe("generateCapabilityReport (no AI provider — rule-based fallback)", () => {
  it("weighs dimensions by their criteria's rubric weight and averages to the overall score", async () => {
    const scenario = buildScenario("ASSESSMENT");
    const report = await generateCapabilityReport(null, scenario, [], new Set(["c1"]), new Map(), null);

    expect(report.dimensions.find((d) => d.key === "discovery")?.score).toBe(100);
    expect(report.dimensions.find((d) => d.key === "closing")?.score).toBe(0);
    // Equal rubric weights (1 and 1) → plain average of 100 and 0.
    expect(report.overallScore).toBe(50);
    expect(report.verdict).toBe(verdictForScore(50));
  });

  it("lists met criteria as strengths and unmet ones as improvements", async () => {
    const scenario = buildScenario("ASSESSMENT");
    const report = await generateCapabilityReport(null, scenario, [], new Set(["c1"]), new Map(), null);

    expect(report.strengths).toContain("Discovered the need");
    expect(report.improvements).toContain("Closed with a next step");
  });

  it("does not penalize non-GUIDED modes for verbatim-reading adherence", async () => {
    const scenario = buildScenario("ASSESSMENT");
    const report = await generateCapabilityReport(null, scenario, [], new Set(["c1"]), new Map(), 1);
    expect(report.overallScore).toBe(50);
  });

  it("shaves points off a GUIDED-mode score for high verbatim-reading adherence", async () => {
    const scenario = buildScenario("GUIDED");
    const withoutAdherence = await generateCapabilityReport(null, scenario, [], new Set(["c1"]), new Map(), null);
    const withFullAdherence = await generateCapabilityReport(null, scenario, [], new Set(["c1"]), new Map(), 1);

    expect(withoutAdherence.overallScore).toBe(50);
    expect(withFullAdherence.overallScore).toBeLessThan(withoutAdherence.overallScore);
  });

  it("never lets the GUIDED-mode penalty push the score below zero", async () => {
    const scenario = buildScenario("GUIDED");
    const report = await generateCapabilityReport(null, scenario, [], new Set(), new Map(), 1);
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("gives a dimension with no mapped criteria a neutral score rather than zero", async () => {
    const scenario = {
      objective: "",
      mode: "ASSESSMENT",
      rubric: [],
      capabilityDimensions: [{ key: "rapport", label: "Rapport", criteriaKeys: [] }],
    } as unknown as Scenario;

    const report = await generateCapabilityReport(null, scenario, [], new Set(), new Map(), null);
    expect(report.dimensions[0]?.score).toBe(70);
  });
});
