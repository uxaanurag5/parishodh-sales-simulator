import { z } from "zod";
import { captureSchema, capabilityReportSchema, turnSchema } from "./models.js";

export const criterionDisplaySchema = z.object({
  criterionKey: z.string(),
  title: z.string(),
  question: z.string(),
  met: z.boolean(),
  evidence: z.string().nullable(),
});
export type CriterionDisplay = z.infer<typeof criterionDisplaySchema>;

export const sessionReportSchema = z.object({
  sessionId: z.string(),
  learnerName: z.string(),
  avatarInitials: z.string(),
  avatarColor: z.string(),
  scenarioTitle: z.string(),
  customerName: z.string(),
  course: z.object({
    title: z.string(),
    completed: z.boolean(),
  }),
  assessment: z.object({
    title: z.string(),
    score: z.number().int(),
    passed: z.boolean(),
  }),
  learningScore: z.number().int(),
  report: capabilityReportSchema,
  criteriaResults: z.array(criterionDisplaySchema),
  turns: z.array(turnSchema),
  captures: z.array(captureSchema),
});
export type SessionReport = z.infer<typeof sessionReportSchema>;
