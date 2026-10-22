import type { FastifyInstance } from "fastify";
import { sessionReportSchema } from "@parishodh/shared";
import { prisma } from "../db.js";

export default async function reportRoutes(app: FastifyInstance) {
  app.get("/api/reports/:sessionId", { preHandler: app.authenticate }, async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    const session = await prisma.simSession.findUnique({
      where: { id: sessionId },
      include: {
        liveTask: { include: { scenario: true, assignee: true } },
      },
    });
    if (!session) return reply.code(404).send({ error: "Session not found" });

    const isOwner = session.liveTask.assigneeId === request.user.sub;
    if (!isOwner && request.user.role === "LEARNER") {
      return reply.code(403).send({ error: "Forbidden" });
    }

    const report = await prisma.capabilityReport.findUnique({ where: { sessionId } });
    if (!report) {
      return reply.code(404).send({ error: "Report not available yet" });
    }

    const learner = session.liveTask.assignee;
    const [turns, captures, criterionResults, enrollment, attempt] = await Promise.all([
      prisma.turn.findMany({ where: { sessionId }, orderBy: { index: "asc" } }),
      prisma.capture.findMany({ where: { sessionId }, orderBy: { capturedAt: "asc" } }),
      prisma.criterionResult.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" } }),
      prisma.enrollment.findFirst({ where: { userId: learner.id }, include: { course: true } }),
      prisma.assessmentAttempt.findFirst({
        where: { userId: learner.id },
        include: { assessment: true },
        orderBy: { takenAt: "desc" },
      }),
    ]);

    const latestByKey = new Map<string, { met: boolean; evidence: string }>();
    for (const result of criterionResults) {
      latestByKey.set(result.criterionKey, { met: result.met, evidence: result.evidence });
    }
    const rubric = JSON.parse(session.liveTask.scenario.rubric) as {
      criterionKey: string;
      title: string;
      question: string;
    }[];
    const criteriaResults = rubric.map((criterion) => {
      const latest = latestByKey.get(criterion.criterionKey);
      return {
        criterionKey: criterion.criterionKey,
        title: criterion.title,
        question: criterion.question,
        met: latest?.met ?? false,
        evidence: latest?.evidence ?? null,
      };
    });

    const payload = {
      sessionId: session.id,
      learnerName: learner.name,
      avatarInitials: learner.avatarInitials,
      avatarColor: learner.avatarColor,
      scenarioTitle: session.liveTask.scenario.title,
      customerName: session.liveTask.scenario.customerName,
      course: {
        title: enrollment?.course.title ?? "",
        completed: enrollment?.status === "COMPLETED",
      },
      assessment: {
        title: attempt?.assessment.title ?? "",
        score: attempt?.score ?? 0,
        passed: attempt?.passed ?? false,
      },
      learningScore: attempt?.score ?? 0,
      criteriaResults,
      report: {
        id: report.id,
        sessionId: report.sessionId,
        dimensions: JSON.parse(report.dimensions),
        overallScore: report.overallScore,
        verdict: report.verdict,
        strengths: JSON.parse(report.strengths),
        improvements: JSON.parse(report.improvements),
      },
      turns: turns.map((t) => ({
        id: t.id,
        sessionId: t.sessionId,
        index: t.index,
        speaker: t.speaker,
        text: t.text,
        stage: t.stage,
        suggestedText: t.suggestedText,
        adherence: t.adherence,
        satisfactionAfter: t.satisfactionAfter,
        startedAt: t.startedAt.toISOString(),
        endedAt: t.endedAt ? t.endedAt.toISOString() : null,
      })),
      captures: captures.map((c) => ({
        id: c.id,
        sessionId: c.sessionId,
        key: c.key,
        label: c.label,
        value: c.value,
        turnId: c.turnId,
        capturedAt: c.capturedAt.toISOString(),
      })),
    };

    return sessionReportSchema.parse(payload);
  });
}
