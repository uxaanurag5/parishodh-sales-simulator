import type { FastifyInstance } from "fastify";
import { getGitSummary, listBranches } from "../integrations/git.js";
import { getGithubBranches, getGithubSummary } from "../integrations/github.js";

export default async function gitRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { days?: string; branch?: string } }>("/api/git/summary", async (req) => {
    const days = Number(req.query.days ?? 30) || 30;
    return getGitSummary(days, req.query.branch || undefined);
  });

  app.get<{ Querystring: { days?: string; branch?: string } }>("/api/github/summary", async (req) => {
    const days = Number(req.query.days ?? 30) || 30;
    return getGithubSummary(days, req.query.branch || undefined);
  });

  app.get("/api/git/branches", async () => {
    const local = listBranches();
    const remoteOnly = (await getGithubBranches()).filter((name) => !local.some((b) => b.name === name));
    return {
      branches: [...local, ...remoteOnly.map((name) => ({ name, isCurrent: false }))],
    };
  });
}
