import type { FastifyInstance } from "fastify";
import { getGitSummary } from "../integrations/git.js";
import { getGithubSummary } from "../integrations/github.js";

export default async function gitRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { days?: string } }>("/api/git/summary", async (req) => {
    const days = Number(req.query.days ?? 30) || 30;
    return getGitSummary(days);
  });

  app.get<{ Querystring: { days?: string } }>("/api/github/summary", async (req) => {
    const days = Number(req.query.days ?? 30) || 30;
    return getGithubSummary(days);
  });
}
