import { z } from "zod";
import { simSessionStatusSchema } from "./enums.js";
import { turnSchema, type Turn, type Capture } from "./models.js";

export const coachStatusSchema = z.enum(["LISTENING", "GENERATING", "READY"]);
export type CoachStatus = z.infer<typeof coachStatusSchema>;

const customerSummarySchema = z.object({
  name: z.string(),
  initials: z.string(),
  requirement: z.string(),
  intent: z.string(),
  preferredColour: z.string(),
});

export const sessionStateSchema = z.object({
  status: simSessionStatusSchema,
  stage: z.string().nullable(),
  satisfaction: z.number().int(),
  turns: z.array(turnSchema),
  // Present once the call has rung at least once, so a client that
  // (re)joins mid-call or after it ended still gets the customer summary
  // without needing the one-time call:ringing event.
  customer: customerSummarySchema.nullable(),
});
export type SessionState = z.infer<typeof sessionStateSchema>;

export const callRingingSchema = z.object({
  customer: customerSummarySchema,
});
export type CallRinging = z.infer<typeof callRingingSchema>;

export const stageChangeSchema = z.object({ stage: z.string(), label: z.string() });
export type StageChange = z.infer<typeof stageChangeSchema>;

export const satisfactionUpdateSchema = z.object({
  value: z.number().int(),
  delta: z.number().int(),
  reason: z.string(),
});
export type SatisfactionUpdate = z.infer<typeof satisfactionUpdateSchema>;

export const criteriaUpdateSchema = z.object({ criterionKey: z.string(), met: z.boolean() });
export type CriteriaUpdate = z.infer<typeof criteriaUpdateSchema>;

export interface ServerToClientEvents {
  "session:state": (payload: SessionState) => void;
  "call:ringing": (payload: CallRinging) => void;
  "customer:speaking:start": () => void;
  "customer:text:delta": (payload: { delta: string }) => void;
  "customer:text:final": (payload: { turn: Turn }) => void;
  "coach:status": (payload: { status: CoachStatus }) => void;
  "coach:suggestion": (payload: { text: string }) => void;
  "capture:new": (payload: { capture: Capture }) => void;
  "stage:change": (payload: StageChange) => void;
  "satisfaction:update": (payload: SatisfactionUpdate) => void;
  "criteria:update": (payload: CriteriaUpdate) => void;
  "session:ended": (payload: { reportId: string | null }) => void;
  "session:error": (payload: { message: string }) => void;
}

export interface ClientToServerEvents {
  "session:join": (payload: { sessionId: string }) => void;
  "call:accept": () => void;
  "call:decline": () => void;
  "learner:partial": (payload: { text: string }) => void;
  "learner:final": (payload: { text: string }) => void;
  "call:end": () => void;
}

// Validated at the socket boundary -- every payload a client can send us,
// since socket.io gives no structural guarantee the other end is well-behaved.
export const sessionJoinPayloadSchema = z.object({ sessionId: z.string().min(1).max(100) });
export const learnerTextPayloadSchema = z.object({ text: z.string().max(4000) });
