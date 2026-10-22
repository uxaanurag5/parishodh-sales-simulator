// Scripted-replay timing. Overridable via env so tests can run near-instantly
// while real demo/dev usage keeps the "realistic timing" CLAUDE.md calls for.
export const SCRIPTED_CHARS_PER_SEC = Number(process.env.SCRIPTED_CHARS_PER_SEC ?? 14);
export const SCRIPTED_THINK_MS = Number(process.env.SCRIPTED_THINK_MS ?? 500);
export const RINGING_DELAY_MIN_MS = Number(process.env.RINGING_DELAY_MIN_MS ?? 2000);
export const RINGING_DELAY_MAX_MS = Number(process.env.RINGING_DELAY_MAX_MS ?? 3000);

export const MAX_TURNS = 40;
export const MAX_DURATION_MS = 8 * 60 * 1000;

// Floor between learner turns, mainly to stop a malfunctioning/malicious
// client from hammering the LLM provider. Must stay below the autoplay
// send delay (500ms) and comfortably below realistic human typing/speaking
// pace, or it'll start rejecting legitimate turns.
export const MIN_LEARNER_TURN_INTERVAL_MS = Number(process.env.MIN_LEARNER_TURN_INTERVAL_MS ?? 300);

// Per-role model overrides (CLAUDE.md: "Model name lives in config, never hard-coded in logic").
// Each falls back to the base AI_MODEL when unset, so a single env var still works for everything;
// set the role-specific ones to route cheap/frequent calls (stage detection, judgment scoring) to a
// lighter model while keeping a stronger one for the customer persona the learner actually talks to.
export const AI_MODEL_CUSTOMER = process.env.AI_MODEL_CUSTOMER ?? process.env.AI_MODEL;
export const AI_MODEL_COACH = process.env.AI_MODEL_COACH ?? process.env.AI_MODEL;
export const AI_MODEL_JUDGMENT = process.env.AI_MODEL_JUDGMENT ?? process.env.AI_MODEL;
export const AI_MODEL_TRAINER = process.env.AI_MODEL_TRAINER ?? process.env.AI_MODEL;
