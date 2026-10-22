import type { FastifyInstance } from "fastify";
import { learnerDashboardSchema } from "@parishodh/shared";
import { prisma } from "../db.js";

export default async function learnerRoutes(app: FastifyInstance) {
  app.get(
    "/api/learner/dashboard",
    { preHandler: [app.authenticate, app.requireRole("LEARNER")] },
    async (request) => {
      const userId = request.user.sub;

      const [enrollment, attempt, liveTask] = await Promise.all([
        prisma.enrollment.findFirst({ where: { userId }, include: { course: true } }),
        prisma.assessmentAttempt.findFirst({
          where: { userId },
          include: { assessment: true },
          orderBy: { takenAt: "desc" },
        }),
        prisma.liveTask.findFirst({
          where: { assigneeId: userId },
          include: { scenario: true },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      let completedSessionId: string | null = null;
      let capabilityScore: number | null = null;
      let verdict: string | null = null;
      if (liveTask?.status === "COMPLETED") {
        const session = await prisma.simSession.findFirst({
          where: { liveTaskId: liveTask.id, status: "ENDED" },
          include: { report: true },
          orderBy: { endedAt: "desc" },
        });
        if (session?.report) {
          completedSessionId = session.id;
          capabilityScore = session.report.overallScore;
          verdict = session.report.verdict;
        }
      }

      return learnerDashboardSchema.parse({
        course: enrollment
          ? {
              title: enrollment.course.title,
              subtitle: enrollment.course.subtitle,
              completedModules: enrollment.completedModules,
              moduleCount: enrollment.course.moduleCount,
              status: enrollment.status,
            }
          : null,
        assessment: attempt
          ? {
              title: attempt.assessment.title,
              questionCount: attempt.assessment.questionCount,
              score: attempt.score,
              passed: attempt.passed,
            }
          : null,
        liveTask: liveTask
          ? {
              id: liveTask.id,
              status: liveTask.status,
              scenario: {
                title: liveTask.scenario.title,
                requirement: liveTask.scenario.requirement,
                intent: liveTask.scenario.intent,
                preferredColour: liveTask.scenario.preferredColour,
                objective: liveTask.scenario.objective,
              },
              completedSessionId,
              capabilityScore,
              verdict,
            }
          : null,
      });
    },
  );
}
