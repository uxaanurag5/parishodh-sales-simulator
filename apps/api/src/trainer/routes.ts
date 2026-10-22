import type { FastifyInstance } from "fastify";
import {
  assignScenarioRequestSchema,
  assignScenarioResponseSchema,
  generateScenarioRequestSchema,
  testCallResponseSchema,
  trainerLearnerSchema,
  trainerReportRowSchema,
  trainerScenarioSummarySchema,
  trainerStatsSchema,
} from "@parishodh/shared";
import { prisma } from "../db.js";
import { buildProvider } from "../sim/llm/provider.js";
import { generateScenarioContent } from "./scenarioGenerator.js";
import {
  CAPABILITY_DIMENSIONS,
  CAPTURE_DEFINITIONS,
  DEFAULT_SATISFACTION_START,
  RUBRIC,
  STAGES,
} from "./scenarioTemplate.js";

export default async function trainerRoutes(app: FastifyInstance) {
  const guard = { preHandler: [app.authenticate, app.requireRole("TRAINER", "ADMIN")] };

  const scenarioGenGuard = {
    preHandler: guard.preHandler,
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  };

  app.post("/api/trainer/scenarios", scenarioGenGuard, async (request, reply) => {
    const body = generateScenarioRequestSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: "Invalid request", issues: body.error.issues });
    }

    const provider = buildProvider();
    const content = await generateScenarioContent(provider, body.data.brief, body.data.product);

    const scenario = await prisma.scenario.create({
      data: {
        title: content.title,
        product: content.product,
        customerName: content.customerName,
        customerInitials: content.customerInitials,
        customerPersona: content.customerPersona,
        requirement: content.requirement,
        intent: content.intent,
        preferredColour: content.preferredColour,
        objective: content.objective,
        openingLine: content.openingLine,
        hiddenFacts: JSON.stringify(content.hiddenFacts),
        objections: JSON.stringify(content.objections),
        stages: JSON.stringify(STAGES),
        captureDefinitions: JSON.stringify(CAPTURE_DEFINITIONS),
        rubric: JSON.stringify(RUBRIC),
        capabilityDimensions: JSON.stringify(CAPABILITY_DIMENSIONS),
        mode: "GUIDED",
        goldenTranscript: JSON.stringify([]),
        satisfactionStart: DEFAULT_SATISFACTION_START,
      },
    });

    return reply.code(201).send(
      trainerScenarioSummarySchema.parse({
        id: scenario.id,
        title: scenario.title,
        product: scenario.product,
        mode: scenario.mode,
      }),
    );
  });

  app.get("/api/trainer/scenarios", guard, async () => {
    const scenarios = await prisma.scenario.findMany({ orderBy: { title: "asc" } });
    return scenarios.map((s) =>
      trainerScenarioSummarySchema.parse({ id: s.id, title: s.title, product: s.product, mode: s.mode }),
    );
  });

  app.get("/api/trainer/learners", guard, async () => {
    const learners = await prisma.user.findMany({ where: { role: "LEARNER" }, orderBy: { name: "asc" } });
    return learners.map((u) =>
      trainerLearnerSchema.parse({
        id: u.id,
        name: u.name,
        team: u.team,
        avatarInitials: u.avatarInitials,
        avatarColor: u.avatarColor,
      }),
    );
  });

  app.post("/api/trainer/assignments", guard, async (request, reply) => {
    const body = assignScenarioRequestSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: "Invalid request", issues: body.error.issues });
    }

    const scenario = await prisma.scenario.findUnique({ where: { id: body.data.scenarioId } });
    if (!scenario) return reply.code(404).send({ error: "Scenario not found" });

    const dueAt = body.data.dueAt ? new Date(body.data.dueAt) : null;
    const created = await prisma.$transaction(
      body.data.learnerIds.map((learnerId) =>
        prisma.liveTask.create({
          data: {
            scenarioId: scenario.id,
            assigneeId: learnerId,
            assignedById: request.user.sub,
            status: "ASSIGNED",
            dueAt,
          },
        }),
      ),
    );

    return assignScenarioResponseSchema.parse({ created: created.length });
  });

  app.post("/api/trainer/scenarios/:id/test-call", guard, async (request, reply) => {
    const { id } = request.params as { id: string };
    const scenario = await prisma.scenario.findUnique({ where: { id } });
    if (!scenario) return reply.code(404).send({ error: "Scenario not found" });

    const liveTask = await prisma.liveTask.create({
      data: {
        scenarioId: scenario.id,
        assigneeId: request.user.sub,
        assignedById: request.user.sub,
        status: "ASSIGNED",
      },
    });
    const session = await prisma.simSession.create({
      data: { liveTaskId: liveTask.id, status: "WAITING" },
    });

    return reply.code(201).send(testCallResponseSchema.parse({ sessionId: session.id }));
  });

  app.get("/api/trainer/reports", guard, async () => {
    const sessions = await prisma.simSession.findMany({
      where: { status: "ENDED", report: { isNot: null } },
      include: { report: true, liveTask: { include: { scenario: true, assignee: true } } },
      orderBy: { endedAt: "desc" },
    });

    return sessions.map((s) => {
      const durationSeconds =
        s.startedAt && s.endedAt ? Math.round((s.endedAt.getTime() - s.startedAt.getTime()) / 1000) : null;
      return trainerReportRowSchema.parse({
        sessionId: s.id,
        learnerName: s.liveTask.assignee.name,
        scenarioTitle: s.liveTask.scenario.title,
        endedAt: s.endedAt ? s.endedAt.toISOString() : null,
        durationSeconds,
        overallScore: s.report!.overallScore,
        verdict: s.report!.verdict,
      });
    });
  });

  app.get("/api/trainer/reports/stats", guard, async () => {
    const sessions = await prisma.simSession.findMany({
      where: { status: "ENDED", report: { isNot: null } },
      include: { report: true, liveTask: { include: { assignee: true } } },
    });

    const dimensionTotals = new Map<string, { label: string; sum: number; count: number }>();
    const scatter: { learnerName: string; learningScore: number; liveScore: number }[] = [];

    for (const session of sessions) {
      const dims = JSON.parse(session.report!.dimensions) as { key: string; label: string; score: number }[];
      for (const dim of dims) {
        const entry = dimensionTotals.get(dim.key) ?? { label: dim.label, sum: 0, count: 0 };
        entry.sum += dim.score;
        entry.count += 1;
        dimensionTotals.set(dim.key, entry);
      }

      const attempt = await prisma.assessmentAttempt.findFirst({
        where: { userId: session.liveTask.assigneeId },
        orderBy: { takenAt: "desc" },
      });
      scatter.push({
        learnerName: session.liveTask.assignee.name,
        learningScore: attempt?.score ?? 0,
        liveScore: session.report!.overallScore,
      });
    }

    const dimensionAverages = Array.from(dimensionTotals.entries()).map(([key, value]) => ({
      key,
      label: value.label,
      average: Math.round((value.sum / value.count) * 10) / 10,
    }));

    return trainerStatsSchema.parse({ dimensionAverages, scatter });
  });
}
