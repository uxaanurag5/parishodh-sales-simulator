import type { FastifyInstance } from "fastify";
import { getClaudeUsageSummary } from "../integrations/anthropicUsage.js";

export default async function claudeRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { days?: string } }>("/api/claude/usage", async (req) => {
    const days = Number(req.query.days ?? 7) || 7;
    return getClaudeUsageSummary(days);
  });
}
