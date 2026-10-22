import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { Server as SocketIOServer } from "socket.io";
import { healthResponseSchema, type ClientToServerEvents, type ServerToClientEvents } from "@parishodh/shared";
import authPlugin from "./auth/plugin.js";
import authRoutes from "./auth/routes.js";
import learnerRoutes from "./learner/routes.js";
import liveTaskRoutes from "./live-tasks/routes.js";
import reportRoutes from "./reports/routes.js";
import trainerRoutes from "./trainer/routes.js";
import { registerSimNamespace } from "./sim/socket.js";

const PORT = Number(process.env.PORT ?? 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:5173";

const app = Fastify({
  logger: {
    redact: {
      paths: ["req.headers.authorization", "req.headers.cookie"],
      censor: "[redacted]",
    },
  },
});

await app.register(cors, { origin: WEB_ORIGIN });
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
await app.register(authPlugin);
await app.register(authRoutes);
await app.register(learnerRoutes);
await app.register(liveTaskRoutes);
await app.register(reportRoutes);
await app.register(trainerRoutes);

app.get("/api/health", async () => healthResponseSchema.parse({ ok: true }));

await app.listen({ port: PORT, host: "0.0.0.0" });

const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(app.server, {
  cors: { origin: WEB_ORIGIN },
});
registerSimNamespace(io);

app.log.info(`Parishodh API listening on http://localhost:${PORT}`);
