import { z } from "zod";

export const healthResponseSchema = z.object({
  ok: z.literal(true),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export * from "./enums.js";
export * from "./models.js";
export * from "./auth.js";
export * from "./dashboard.js";
export * from "./socket.js";
export * from "./textMatch.js";
export * from "./report.js";
export * from "./trainer.js";
