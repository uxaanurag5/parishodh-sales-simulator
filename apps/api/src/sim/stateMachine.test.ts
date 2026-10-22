import { describe, expect, it } from "vitest";
import { assertTransition, canTransition } from "./stateMachine.js";

describe("sim session state machine", () => {
  it("allows the documented happy path", () => {
    expect(canTransition("WAITING", "RINGING")).toBe(true);
    expect(canTransition("RINGING", "ACTIVE")).toBe(true);
    expect(canTransition("ACTIVE", "ENDED")).toBe(true);
  });

  it("allows declining a ringing call", () => {
    expect(canTransition("RINGING", "ENDED")).toBe(true);
  });

  it("rejects skipping states", () => {
    expect(canTransition("WAITING", "ACTIVE")).toBe(false);
    expect(canTransition("WAITING", "ENDED")).toBe(false);
  });

  it("rejects transitions out of ENDED", () => {
    expect(canTransition("ENDED", "WAITING")).toBe(false);
    expect(canTransition("ENDED", "ACTIVE")).toBe(false);
  });

  it("throws on an invalid transition via assertTransition", () => {
    expect(() => assertTransition("WAITING", "ACTIVE")).toThrow();
    expect(() => assertTransition("WAITING", "RINGING")).not.toThrow();
  });
});
