import { userSchema, type User } from "@parishodh/shared";
import type { User as PrismaUser } from "@prisma/client";

export function toPublicUser(user: PrismaUser): User {
  return userSchema.parse({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team,
    avatarInitials: user.avatarInitials,
    avatarColor: user.avatarColor,
  });
}
