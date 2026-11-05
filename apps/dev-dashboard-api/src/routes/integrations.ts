import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { clearCredential, getCredential, setCredential } from "../settings/store.js";
import { getJiraSummary, testJiraConnection } from "../integrations/jira.js";
import { getConfluenceSummary, testConfluenceConnection } from "../integrations/confluence.js";

const credentialBody = z.object({
  baseUrl: z.string().url(),
  email: z.string().email(),
  apiToken: z.string().min(1),
});

function maskedStatus(kind: "jira" | "confluence") {
  const c = getCredential(kind);
  return c ? { configured: true, baseUrl: c.baseUrl, email: c.email } : { configured: false };
}

export default async function integrationsRoutes(app: FastifyInstance) {
  app.get("/api/integrations/status", async () => ({
    jira: maskedStatus("jira"),
    confluence: maskedStatus("confluence"),
  }));

  app.get("/api/integrations/jira/config", async () => maskedStatus("jira"));
  app.get("/api/integrations/confluence/config", async () => maskedStatus("confluence"));

  app.post("/api/integrations/jira/config", async (req, reply) => {
    const parsed = credentialBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.message });
    const result = await testJiraConnection(parsed.data);
    if (result.ok) setCredential("jira", parsed.data);
    return { ...result, configured: result.ok };
  });

  app.post("/api/integrations/confluence/config", async (req, reply) => {
    const parsed = credentialBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.message });
    const result = await testConfluenceConnection(parsed.data);
    if (result.ok) setCredential("confluence", parsed.data);
    return { ...result, configured: result.ok };
  });

  app.delete("/api/integrations/jira/config", async () => {
    clearCredential("jira");
    return { configured: false };
  });
  app.delete("/api/integrations/confluence/config", async () => {
    clearCredential("confluence");
    return { configured: false };
  });

  app.get("/api/integrations/jira/summary", async () => getJiraSummary(getCredential("jira")));
  app.get("/api/integrations/confluence/summary", async () => getConfluenceSummary(getCredential("confluence")));
}
