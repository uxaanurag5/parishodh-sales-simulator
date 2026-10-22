import { z } from "zod";

export const ROLES = ["LEARNER", "TRAINER", "ADMIN"] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export const ENROLLMENT_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;
export const enrollmentStatusSchema = z.enum(ENROLLMENT_STATUSES);
export type EnrollmentStatus = z.infer<typeof enrollmentStatusSchema>;

export const SCENARIO_MODES = ["GUIDED", "ASSESSMENT", "SCRIPTED"] as const;
export const scenarioModeSchema = z.enum(SCENARIO_MODES);
export type ScenarioMode = z.infer<typeof scenarioModeSchema>;

export const LIVE_TASK_STATUSES = ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] as const;
export const liveTaskStatusSchema = z.enum(LIVE_TASK_STATUSES);
export type LiveTaskStatus = z.infer<typeof liveTaskStatusSchema>;

export const SIM_SESSION_STATUSES = ["WAITING", "RINGING", "ACTIVE", "ENDED"] as const;
export const simSessionStatusSchema = z.enum(SIM_SESSION_STATUSES);
export type SimSessionStatus = z.infer<typeof simSessionStatusSchema>;

export const SPEAKERS = ["LEARNER", "CUSTOMER"] as const;
export const speakerSchema = z.enum(SPEAKERS);
export type Speaker = z.infer<typeof speakerSchema>;
