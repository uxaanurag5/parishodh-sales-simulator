import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { loginRequestSchema, roleSchema, type LoginResponse } from "@parishodh/shared";
import { prisma } from "../db.js";
import { toPublicUser } from "./serialize.js";

export default async function authRoutes(app: FastifyInstance) {
  app.post(
    "/api/auth/login",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const body = loginRequestSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: "Invalid request", issues: body.error.issues });
      }

      const user = await prisma.user.findUnique({ where: { email: body.data.email } });
      if (!user || !(await bcrypt.compare(body.data.password, user.passwordHash))) {
        return reply.code(401).send({ error: "Invalid email or password" });
      }

      const token = app.jwt.sign({ sub: user.id, role: roleSchema.parse(user.role) });
      const response: LoginResponse = { token, user: toPublicUser(user) };
      return response;
    },
  );

  app.get("/api/me", { preHandler: app.authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.user.sub } });
    if (!user) {
      return reply.code(404).send({ error: "User not found" });
    }
    return toPublicUser(user);
  });
}
