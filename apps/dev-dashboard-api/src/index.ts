import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { PORT, WEB_ORIGIN } from "./config.js";
import gitRoutes from "./routes/git.js";
import claudeRoutes from "./routes/claude.js";
import integrationsRoutes from "./routes/integrations.js";
import coworkRoutes from "./routes/cowork.js";
import qualityRoutes from "./routes/quality.js";

const app = Fastify({
  logger: {
    redact: { paths: ["req.headers.authorization"], censor: "[redacted]" },
  },
});

await app.register(cors, { origin: WEB_ORIGIN });
await app.register(gitRoutes);
await app.register(claudeRoutes);
await app.register(integrationsRoutes);
await app.register(coworkRoutes);
await app.register(qualityRoutes);

app.get("/api/health", async () => ({ ok: true }));

await app.listen({ port: PORT, host: "0.0.0.0" });
app.log.info(`Dev Dashboard API listening on http://localhost:${PORT}`);
