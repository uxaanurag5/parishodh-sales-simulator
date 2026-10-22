import "dotenv/config";

// Scripted-mode timing is "realistic" by default (CLAUDE.md), which would
// make a full 22-turn replay take well over a minute. Speed it up for tests.
process.env.SCRIPTED_CHARS_PER_SEC = "4000";
process.env.SCRIPTED_THINK_MS = "5";
process.env.RINGING_DELAY_MIN_MS = "20";
process.env.RINGING_DELAY_MAX_MS = "40";
process.env.MIN_LEARNER_TURN_INTERVAL_MS = "0";
