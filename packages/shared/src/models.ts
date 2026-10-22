import { z } from "zod";
import {
  enrollmentStatusSchema,
  liveTaskStatusSchema,
  roleSchema,
  scenarioModeSchema,
  simSessionStatusSchema,
  speakerSchema,
} from "./enums.js";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: roleSchema,
  team: z.string().nullable(),
  avatarInitials: z.string(),
  avatarColor: z.string(),
});
export type User = z.infer<typeof userSchema>;

export const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  moduleCount: z.number().int(),
});
export type Course = z.infer<typeof courseSchema>;

export const moduleSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  order: z.number().int(),
  title: z.string(),
});
export type Module = z.infer<typeof moduleSchema>;

export const enrollmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  completedModules: z.number().int(),
  status: enrollmentStatusSchema,
});
export type Enrollment = z.infer<typeof enrollmentSchema>;

export const assessmentSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  questionCount: z.number().int(),
  passMark: z.number().int(),
});
export type Assessment = z.infer<typeof assessmentSchema>;

export const assessmentAttemptSchema = z.object({
  id: z.string(),
  userId: z.string(),
  assessmentId: z.string(),
  score: z.number().int(),
  passed: z.boolean(),
  takenAt: z.string(),
});
export type AssessmentAttempt = z.infer<typeof assessmentAttemptSchema>;

export const stageSchema = z.object({
  key: z.string(),
  label: z.string(),
});
export type Stage = z.infer<typeof stageSchema>;

export const captureDefinitionSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
});
export type CaptureDefinition = z.infer<typeof captureDefinitionSchema>;

export const rubricCriterionSchema = z.object({
  criterionKey: z.string(),
  title: z.string(),
  question: z.string(),
  weight: z.number(),
});
export type RubricCriterion = z.infer<typeof rubricCriterionSchema>;

export const capabilityDimensionDefSchema = z.object({
  key: z.string(),
  label: z.string(),
  criteriaKeys: z.array(z.string()),
});
export type CapabilityDimensionDef = z.infer<typeof capabilityDimensionDefSchema>;

export const objectionSchema = z.object({
  key: z.string(),
  stage: z.string(),
  prompt: z.string(),
});
export type Objection = z.infer<typeof objectionSchema>;

export const goldenTranscriptCaptureSchema = z.object({
  key: z.string(),
  value: z.string(),
});
export type GoldenTranscriptCapture = z.infer<typeof goldenTranscriptCaptureSchema>;

export const goldenTranscriptCriterionSchema = z.object({
  key: z.string(),
  evidence: z.string(),
});
export type GoldenTranscriptCriterion = z.infer<typeof goldenTranscriptCriterionSchema>;

export const goldenTranscriptTurnSchema = z.object({
  stage: z.string(),
  speaker: speakerSchema,
  text: z.string(),
  // SCRIPTED-mode-only replay data: which captures/rubric criteria this turn
  // reveals or satisfies, and the satisfaction value after this turn. Omitted
  // on turns that change none of these.
  captures: z.array(goldenTranscriptCaptureSchema).optional(),
  criteriaMet: z.array(goldenTranscriptCriterionSchema).optional(),
  satisfactionAfter: z.number().int().optional(),
});
export type GoldenTranscriptTurn = z.infer<typeof goldenTranscriptTurnSchema>;

export const hiddenFactsSchema = z.record(z.string(), z.string());
export type HiddenFacts = z.infer<typeof hiddenFactsSchema>;

export const scenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  product: z.string(),
  customerName: z.string(),
  customerInitials: z.string(),
  customerPersona: z.string(),
  requirement: z.string(),
  intent: z.string(),
  preferredColour: z.string(),
  objective: z.string(),
  openingLine: z.string(),
  hiddenFacts: hiddenFactsSchema,
  objections: z.array(objectionSchema),
  stages: z.array(stageSchema),
  captureDefinitions: z.array(captureDefinitionSchema),
  rubric: z.array(rubricCriterionSchema),
  capabilityDimensions: z.array(capabilityDimensionDefSchema),
  mode: scenarioModeSchema,
  goldenTranscript: z.array(goldenTranscriptTurnSchema),
  satisfactionStart: z.number().int(),
});
export type Scenario = z.infer<typeof scenarioSchema>;

export const liveTaskSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  assigneeId: z.string(),
  assignedById: z.string(),
  status: liveTaskStatusSchema,
  dueAt: z.string().nullable(),
});
export type LiveTask = z.infer<typeof liveTaskSchema>;

export const simSessionSchema = z.object({
  id: z.string(),
  liveTaskId: z.string(),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
  currentStage: z.string().nullable(),
  satisfaction: z.number().int(),
  status: simSessionStatusSchema,
});
export type SimSession = z.infer<typeof simSessionSchema>;

export const turnSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  index: z.number().int(),
  speaker: speakerSchema,
  text: z.string(),
  stage: z.string(),
  suggestedText: z.string().nullable(),
  adherence: z.number().nullable(),
  satisfactionAfter: z.number().int().nullable(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
});
export type Turn = z.infer<typeof turnSchema>;

export const captureSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  key: z.string(),
  label: z.string(),
  value: z.string(),
  turnId: z.string().nullable(),
  capturedAt: z.string(),
});
export type Capture = z.infer<typeof captureSchema>;

export const criterionResultSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  criterionKey: z.string(),
  met: z.boolean(),
  evidence: z.string(),
  score: z.number().int(),
});
export type CriterionResult = z.infer<typeof criterionResultSchema>;

export const capabilityDimensionScoreSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number().int(),
  evidence: z.string().optional(),
});
export type CapabilityDimensionScore = z.infer<typeof capabilityDimensionScoreSchema>;

export const capabilityReportSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  dimensions: z.array(capabilityDimensionScoreSchema),
  overallScore: z.number().int(),
  verdict: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
});
export type CapabilityReport = z.infer<typeof capabilityReportSchema>;
