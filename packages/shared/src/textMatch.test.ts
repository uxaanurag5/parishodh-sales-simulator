import { describe, expect, it } from "vitest";
import { wordMatchProgress } from "./textMatch.js";

describe("wordMatchProgress", () => {
  it("fully matches an exact echo", () => {
    const { matchedWords, totalWords, ratio } = wordMatchProgress(
      "Could you tell me more about your requirements",
      "Could you tell me more about your requirements",
    );
    expect(matchedWords).toBe(totalWords);
    expect(ratio).toBe(1);
  });

  it("reports zero progress before any speech", () => {
    const { matchedWords, ratio } = wordMatchProgress("Could you tell me more", "");
    expect(matchedWords).toBe(0);
    expect(ratio).toBe(0);
  });

  it("tracks partial progress as the learner speaks word by word", () => {
    const { matchedWords, totalWords } = wordMatchProgress(
      "Could you tell me more about your requirements",
      "Could you tell me",
    );
    expect(matchedWords).toBe(4);
    expect(totalWords).toBe(8);
  });

  it("tolerates word-stem mismatches (STT partials, inflections)", () => {
    // "requirement" is a 4+ char prefix of "requirements" — should still count as a match.
    const { matchedWords } = wordMatchProgress("tell me your requirements please", "tell me your requirement");
    expect(matchedWords).toBe(4);
  });

  it("is case-insensitive and ignores punctuation", () => {
    const { matchedWords, totalWords } = wordMatchProgress(
      "Could you tell me, more about your requirements?",
      "COULD YOU TELL ME, MORE ABOUT YOUR REQUIREMENTS!",
    );
    expect(matchedWords).toBe(totalWords);
  });

  it("skips a short filler word without losing the match", () => {
    // "um" inserted between "me" and "more" — matcher looks ahead up to 2 words.
    const { matchedWords, totalWords } = wordMatchProgress(
      "Could you tell me more about your requirements",
      "Could you tell me um more about your requirements",
    );
    expect(matchedWords).toBe(totalWords);
  });

  it("never exceeds the suggestion's own word count", () => {
    const { matchedWords, totalWords } = wordMatchProgress("Hello there", "Hello there Hello there Hello there");
    expect(matchedWords).toBeLessThanOrEqual(totalWords);
  });

  it("treats an empty suggestion as zero progress with no division by zero", () => {
    const { matchedWords, totalWords, ratio } = wordMatchProgress("", "anything at all");
    expect(matchedWords).toBe(0);
    expect(totalWords).toBe(0);
    expect(ratio).toBe(0);
    expect(Number.isNaN(ratio)).toBe(false);
  });

  it("gives up on an unrelated utterance rather than fuzzy-matching everything", () => {
    const { matchedWords } = wordMatchProgress(
      "Could you tell me more about your budget and timeline",
      "I like cricket and movies on weekends",
    );
    expect(matchedWords).toBe(0);
  });
});
