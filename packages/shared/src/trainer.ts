import { z } from "zod";
import { scenarioModeSchema } from "./enums.js";

export const trainerScenarioSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  product: z.string(),
  mode: scenarioModeSchema,
});
export type TrainerScenarioSummary = z.infer<typeof trainerScenarioSummarySchema>;

export const generateScenarioRequestSchema = z.object({
  brief: z.string().min(1),
  product: z.string().optional(),
});
export type GenerateScenarioRequest = z.infer<typeof generateScenarioRequestSchema>;

export const trainerLearnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string().nullable(),
  avatarInitials: z.string(),
  avatarColor: z.string(),
});
export type TrainerLearner = z.infer<typeof trainerLearnerSchema>;

export const assignScenarioRequestSchema = z.object({
  scenarioId: z.string(),
  learnerIds: z.array(z.string()).min(1),
  dueAt: z.string().nullable().optional(),
});
export type AssignScenarioRequest = z.infer<typeof assignScenarioRequestSchema>;

export const assignScenarioResponseSchema = z.object({
  created: z.number().int(),
});
export type AssignScenarioResponse = z.infer<typeof assignScenarioResponseSchema>;

export const testCallResponseSchema = z.object({
  sessionId: z.string(),
});
export type TestCallResponse = z.infer<typeof testCallResponseSchema>;

export const trainerReportRowSchema = z.object({
  sessionId: z.string(),
  learnerName: z.string(),
  scenarioTitle: z.string(),
  endedAt: z.string().nullable(),
  durationSeconds: z.number().int().nullable(),
  overallScore: z.number().int(),
  verdict: z.string(),
});
export type TrainerReportRow = z.infer<typeof trainerReportRowSchema>;

export const dimensionAverageSchema = z.object({
  key: z.string(),
  label: z.string(),
  average: z.number(),
});
export type DimensionAverage = z.infer<typeof dimensionAverageSchema>;

export const scatterPointSchema = z.object({
  learnerName: z.string(),
  learningScore: z.number().int(),
  liveScore: z.number().int(),
});
export type ScatterPoint = z.infer<typeof scatterPointSchema>;

export const trainerStatsSchema = z.object({
  dimensionAverages: z.array(dimensionAverageSchema),
  scatter: z.array(scatterPointSchema),
});
export type TrainerStats = z.infer<typeof trainerStatsSchema>;
