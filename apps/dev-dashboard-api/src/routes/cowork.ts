import type { FastifyInstance } from "fastify";

export default async function coworkRoutes(app: FastifyInstance) {
  app.get("/api/cowork/activity", async () => ({
    status: "coming_soon" as const,
    note: "Claude.ai documents and Cowork session activity aren't exposed by a public API yet, so this panel can't pull live data. It's wired to this endpoint so it can be filled in the moment that API exists.",
  }));
}
