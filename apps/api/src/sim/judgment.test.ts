import { describe, expect, it } from "vitest";
import { detectUnsupportedPromise, ruleBasedCaptures } from "./judgment.js";
import type { Scenario } from "@parishodh/shared";

const scenario = {
  captureDefinitions: [
    { key: "vehicle_identified", label: "Vehicle identified", description: "" },
    { key: "colour_timeline", label: "Colour & timeline", description: "" },
    { key: "timeline_probed", label: "Timeline probed", description: "" },
    { key: "need_identified", label: "Need identified", description: "" },
    { key: "qualification", label: "Qualification", description: "" },
    { key: "objection_handled", label: "Objection handled", description: "" },
    { key: "next_step_agreed", label: "Next step agreed", description: "" },
  ],
} as unknown as Scenario;

describe("ruleBasedCaptures", () => {
  it("detects the vehicle and colour/timeline from the customer's opening line", () => {
    const hits = ruleBasedCaptures(
      scenario,
      "",
      "I'm planning to buy the Mahindra EV 9S, white, within 3 weeks.",
    );
    expect(hits.map((h) => h.key)).toEqual(expect.arrayContaining(["vehicle_identified", "colour_timeline"]));
  });

  it("detects a replacement need and financing qualification", () => {
    const hits = ruleBasedCaptures(scenario, "", "I'm replacing my existing SUV and will finance part of it.");
    expect(hits.map((h) => h.key)).toEqual(expect.arrayContaining(["need_identified", "qualification"]));
  });

  it("detects the learner probing for timeline flexibility", () => {
    const hits = ruleBasedCaptures(scenario, "Would you have some flexibility on the timeline?", "");
    expect(hits.map((h) => h.key)).toContain("timeline_probed");
  });

  it("detects a next-step/follow-up commitment", () => {
    const hits = ruleBasedCaptures(scenario, "I'll follow up with you shortly.", "");
    expect(hits.map((h) => h.key)).toContain("next_step_agreed");
  });

  it("returns nothing for unrelated small talk", () => {
    const hits = ruleBasedCaptures(scenario, "How's your day going?", "It's going well, thanks.");
    expect(hits).toHaveLength(0);
  });
});

describe("detectUnsupportedPromise", () => {
  it("flags a bare guarantee", () => {
    expect(detectUnsupportedPromise("I guarantee delivery within three weeks.")).toBe(true);
  });

  it("does not flag a hedged answer", () => {
    expect(
      detectUnsupportedPromise("I'll check availability and confirm a realistic delivery date."),
    ).toBe(false);
  });

  it("does not flag an unrelated sentence", () => {
    expect(detectUnsupportedPromise("Let me understand your requirements first.")).toBe(false);
  });
});
