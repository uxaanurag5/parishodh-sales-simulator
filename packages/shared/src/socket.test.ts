import { describe, expect, it } from "vitest";
import { learnerTextPayloadSchema, sessionJoinPayloadSchema } from "./socket.js";

describe("sessionJoinPayloadSchema (socket boundary validation)", () => {
  it("accepts a well-formed session id", () => {
    expect(sessionJoinPayloadSchema.safeParse({ sessionId: "cmv9ci6mj0000kh3l6li5g1zh" }).success).toBe(true);
  });

  it("rejects a missing sessionId", () => {
    expect(sessionJoinPayloadSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an empty sessionId", () => {
    expect(sessionJoinPayloadSchema.safeParse({ sessionId: "" }).success).toBe(false);
  });

  it("rejects a sessionId over 100 characters", () => {
    expect(sessionJoinPayloadSchema.safeParse({ sessionId: "a".repeat(101) }).success).toBe(false);
  });

  it("accepts a sessionId at exactly the 100-character limit", () => {
    expect(sessionJoinPayloadSchema.safeParse({ sessionId: "a".repeat(100) }).success).toBe(true);
  });

  it("rejects a non-string sessionId", () => {
    expect(sessionJoinPayloadSchema.safeParse({ sessionId: 12345 }).success).toBe(false);
  });

  it("rejects a malicious payload shape (array instead of object)", () => {
    expect(sessionJoinPayloadSchema.safeParse(["drop table users"]).success).toBe(false);
  });
});

describe("learnerTextPayloadSchema (socket boundary validation)", () => {
  it("accepts ordinary spoken text", () => {
    expect(learnerTextPayloadSchema.safeParse({ text: "I'm looking for an automatic variant." }).success).toBe(
      true,
    );
  });

  it("accepts text at exactly the 4000-character limit", () => {
    expect(learnerTextPayloadSchema.safeParse({ text: "a".repeat(4000) }).success).toBe(true);
  });

  it("rejects text over the 4000-character limit", () => {
    expect(learnerTextPayloadSchema.safeParse({ text: "a".repeat(4001) }).success).toBe(false);
  });

  it("rejects a missing text field", () => {
    expect(learnerTextPayloadSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a non-string text field", () => {
    expect(learnerTextPayloadSchema.safeParse({ text: { malicious: true } }).success).toBe(false);
  });

  it("rejects a null payload", () => {
    expect(learnerTextPayloadSchema.safeParse(null).success).toBe(false);
  });
});
