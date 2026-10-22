import { createServer } from "node:http";
import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ClientToServerEvents, ServerToClientEvents } from "@parishodh/shared";
import { prisma } from "../db.js";
import { registerSimNamespace } from "./socket.js";

describe("scripted EV 9S call over sockets", () => {
  let httpServer: HttpServer;
  let port: number;
  let userId: string;
  let sessionId: string;

  beforeAll(async () => {
    httpServer = createServer();
    const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
      cors: { origin: "*" },
    });
    registerSimNamespace(io);
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const address = httpServer.address();
    port = typeof address === "object" && address ? address.port : 0;

    const passwordHash = await bcrypt.hash("test1234", 10);
    const user = await prisma.user.create({
      data: {
        name: "Test Learner",
        email: `sim-test-${Date.now()}@example.com`,
        passwordHash,
        role: "LEARNER",
        avatarInitials: "TL",
        avatarColor: "#000000",
      },
    });
    userId = user.id;

    const scenario = await prisma.scenario.findFirstOrThrow({
      where: { title: "Mahindra EV 9S Purchase" },
    });
    const trainer = await prisma.user.findFirstOrThrow({ where: { role: "TRAINER" } });

    const liveTask = await prisma.liveTask.create({
      data: { scenarioId: scenario.id, assigneeId: userId, assignedById: trainer.id, status: "ASSIGNED" },
    });
    const session = await prisma.simSession.create({
      data: { liveTaskId: liveTask.id, status: "WAITING" },
    });
    sessionId = session.id;
  });

  afterAll(async () => {
    await prisma.capabilityReport.deleteMany({ where: { sessionId } });
    await prisma.criterionResult.deleteMany({ where: { sessionId } });
    await prisma.capture.deleteMany({ where: { sessionId } });
    await prisma.turn.deleteMany({ where: { sessionId } });
    await prisma.simSession.delete({ where: { id: sessionId } }).catch(() => {});
    await prisma.liveTask.deleteMany({ where: { assigneeId: userId } });
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    await prisma.$disconnect();
  });

  it("joins, accepts, and completes the call with all events firing in order", async () => {
    const token = jwt.sign({ sub: userId, role: "LEARNER" }, process.env.JWT_SECRET!);
    const client: ClientSocket<ServerToClientEvents, ClientToServerEvents> = ioClient(
      `http://localhost:${port}/sim`,
      { auth: { token }, transports: ["websocket"] },
    );

    const events: string[] = [];
    let reportId: string | null = null;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("timed out waiting for session to end")), 15000);

      client.on("connect_error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      client.on("connect", () => client.emit("session:join", { sessionId }));
      client.on("call:ringing", () => {
        events.push("call:ringing");
        client.emit("call:accept");
      });
      client.on("coach:suggestion", () => {
        events.push("coach:suggestion");
        client.emit("learner:final", { text: "ok" });
      });
      client.on("customer:text:final", () => events.push("customer:text:final"));
      client.on("stage:change", (payload) => events.push(`stage:change:${payload.stage}`));
      client.on("capture:new", (payload) => events.push(`capture:new:${payload.capture.key}`));
      client.on("satisfaction:update", () => events.push("satisfaction:update"));
      client.on("session:ended", (payload) => {
        events.push("session:ended");
        reportId = payload.reportId;
        clearTimeout(timeout);
        resolve();
      });
    });

    client.close();

    expect(events).toContain("call:ringing");
    expect(events.filter((e) => e === "coach:suggestion")).toHaveLength(11);
    expect(events.filter((e) => e === "customer:text:final")).toHaveLength(11);
    expect(events.filter((e) => e.startsWith("capture:new:"))).toHaveLength(9);
    expect(events.filter((e) => e === "satisfaction:update").length).toBeGreaterThan(0);
    expect(events).toContain("stage:change:CUSTOMER_DISCOVERY");
    expect(events).toContain("stage:change:CLOSING_SIMULATION");
    expect(events[events.length - 1]).toBe("session:ended");

    const persistedTurns = await prisma.turn.findMany({ where: { sessionId }, orderBy: { index: "asc" } });
    expect(persistedTurns).toHaveLength(22);

    const persistedCaptures = await prisma.capture.findMany({ where: { sessionId } });
    expect(persistedCaptures).toHaveLength(9);

    expect(reportId).not.toBeNull();
    const report = await prisma.capabilityReport.findUnique({ where: { sessionId } });
    expect(report).not.toBeNull();
    expect(report!.id).toBe(reportId);
    expect(report!.overallScore).toBeGreaterThanOrEqual(0);
    expect(report!.overallScore).toBeLessThanOrEqual(100);
    expect(JSON.parse(report!.dimensions)).toHaveLength(7);

    const updatedLiveTask = await prisma.liveTask.findFirst({ where: { assigneeId: userId } });
    expect(updatedLiveTask?.status).toBe("COMPLETED");

    const criterionResults = await prisma.criterionResult.findMany({ where: { sessionId } });
    const metKeys = new Set(criterionResults.filter((c) => c.met).map((c) => c.criterionKey));
    expect(metKeys.size).toBe(9);
  });
});
