import type { Namespace, Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import {
  learnerTextPayloadSchema,
  sessionJoinPayloadSchema,
  type ClientToServerEvents,
  type Role,
  type ServerToClientEvents,
} from "@parishodh/shared";
import { prisma } from "../db.js";
import { parseScenario } from "./scenario.js";
import { SessionRuntime } from "./SessionRuntime.js";
import type { LlmProvider } from "./llm/types.js";
import { buildProvider } from "./llm/provider.js";
import { MIN_LEARNER_TURN_INTERVAL_MS } from "./config.js";

type SimSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type SimNamespace = Namespace<ClientToServerEvents, ServerToClientEvents>;

const runtimes = new Map<string, SessionRuntime>();
const lastLearnerTurnAt = new WeakMap<SimSocket, number>();

async function getOrCreateRuntime(
  sessionId: string,
  nsp: SimNamespace,
  provider: LlmProvider | null,
): Promise<SessionRuntime | null> {
  const existing = runtimes.get(sessionId);
  if (existing) return existing;

  const session = await prisma.simSession.findUnique({
    where: { id: sessionId },
    include: { liveTask: { include: { scenario: true } } },
  });
  if (!session) return null;

  const scenario = parseScenario(session.liveTask.scenario);
  const runtime = new SessionRuntime(sessionId, scenario, nsp, provider);
  runtimes.set(sessionId, runtime);
  return runtime;
}

function currentSessionId(socket: SimSocket): string | null {
  const rooms = [...socket.rooms].filter((room) => room !== socket.id);
  return rooms[0] ?? null;
}

export function registerSimNamespace(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  const nsp: SimNamespace = io.of("/sim");
  const provider = buildProvider();

  nsp.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("Missing auth token"));
      return;
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET ?? "change-me-in-production") as {
        sub: string;
        role: Role;
      };
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error("Invalid auth token"));
    }
  });

  async function withRuntime(socket: SimSocket, fn: (runtime: SessionRuntime) => Promise<void>) {
    const sessionId = currentSessionId(socket);
    if (!sessionId) return;
    const runtime = runtimes.get(sessionId);
    if (!runtime) return;
    await fn(runtime);
  }

  nsp.on("connection", (socket: SimSocket) => {
    socket.on("session:join", (raw) => {
      const parsed = sessionJoinPayloadSchema.safeParse(raw);
      if (!parsed.success) {
        socket.emit("session:error", { message: "Invalid session:join payload" });
        return;
      }
      void (async () => {
        const runtime = await getOrCreateRuntime(parsed.data.sessionId, nsp, provider);
        if (!runtime) {
          socket.emit("session:error", { message: "Session not found" });
          return;
        }
        await socket.join(parsed.data.sessionId);
        await runtime.onJoin(socket);
      })();
    });

    socket.on("call:accept", () => {
      void withRuntime(socket, (runtime) => runtime.onAccept());
    });

    socket.on("call:decline", () => {
      void withRuntime(socket, (runtime) => runtime.onDecline());
    });

    socket.on("call:end", () => {
      void withRuntime(socket, (runtime) => runtime.onCallEnd());
    });

    socket.on("learner:final", (raw) => {
      const parsed = learnerTextPayloadSchema.safeParse(raw);
      if (!parsed.success) {
        socket.emit("session:error", { message: "Invalid learner:final payload" });
        return;
      }
      const now = Date.now();
      const last = lastLearnerTurnAt.get(socket) ?? 0;
      if (now - last < MIN_LEARNER_TURN_INTERVAL_MS) {
        socket.emit("session:error", { message: "You're sending turns too fast — slow down a touch." });
        return;
      }
      lastLearnerTurnAt.set(socket, now);
      void withRuntime(socket, (runtime) => runtime.onLearnerFinal(parsed.data.text));
    });

    socket.on("learner:partial", (raw) => {
      const parsed = learnerTextPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      void withRuntime(socket, async (runtime) => runtime.onLearnerPartial(parsed.data.text));
    });
  });
}
