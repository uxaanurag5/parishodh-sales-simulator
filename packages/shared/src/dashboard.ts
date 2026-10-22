import { z } from "zod";
import { enrollmentStatusSchema, liveTaskStatusSchema } from "./enums.js";

export const dashboardCourseSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  completedModules: z.number().int(),
  moduleCount: z.number().int(),
  status: enrollmentStatusSchema,
});
export type DashboardCourse = z.infer<typeof dashboardCourseSchema>;

export const dashboardAssessmentSchema = z.object({
  title: z.string(),
  questionCount: z.number().int(),
  score: z.number().int(),
  passed: z.boolean(),
});
export type DashboardAssessment = z.infer<typeof dashboardAssessmentSchema>;

export const dashboardScenarioSummarySchema = z.object({
  title: z.string(),
  requirement: z.string(),
  intent: z.string(),
  preferredColour: z.string(),
  objective: z.string(),
});
export type DashboardScenarioSummary = z.infer<typeof dashboardScenarioSummarySchema>;

export const dashboardLiveTaskSchema = z.object({
  id: z.string(),
  status: liveTaskStatusSchema,
  scenario: dashboardScenarioSummarySchema,
  completedSessionId: z.string().nullable(),
  capabilityScore: z.number().int().nullable(),
  verdict: z.string().nullable(),
});
export type DashboardLiveTask = z.infer<typeof dashboardLiveTaskSchema>;

export const learnerDashboardSchema = z.object({
  course: dashboardCourseSchema.nullable(),
  assessment: dashboardAssessmentSchema.nullable(),
  liveTask: dashboardLiveTaskSchema.nullable(),
});
export type LearnerDashboard = z.infer<typeof learnerDashboardSchema>;

export const createSessionResponseSchema = z.object({
  sessionId: z.string(),
});
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;
