import type { FastifyInstance } from "fastify";
import { createSessionResponseSchema } from "@parishodh/shared";
import { prisma } from "../db.js";

export default async function liveTaskRoutes(app: FastifyInstance) {
  app.post(
    "/api/live-tasks/:id/sessions",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const liveTask = await prisma.liveTask.findUnique({ where: { id } });
      if (!liveTask || liveTask.assigneeId !== request.user.sub) {
        return reply.code(404).send({ error: "Live task not found" });
      }

      const session = await prisma.simSession.create({
        data: { liveTaskId: liveTask.id, status: "WAITING" },
      });

      if (liveTask.status === "ASSIGNED") {
        await prisma.liveTask.update({
          where: { id: liveTask.id },
          data: { status: "IN_PROGRESS" },
        });
      }

      return reply.code(201).send(createSessionResponseSchema.parse({ sessionId: session.id }));
    },
  );
}
