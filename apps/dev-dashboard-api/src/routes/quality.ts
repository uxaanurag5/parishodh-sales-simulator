import type { FastifyInstance } from "fastify";
import { getCoverageSummary } from "../integrations/coverage.js";

export default async function qualityRoutes(app: FastifyInstance) {
  app.get("/api/quality/coverage", async () => getCoverageSummary());
}
