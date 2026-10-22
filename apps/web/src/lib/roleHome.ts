import type { Role } from "@parishodh/shared";

export function homePathForRole(role: Role): string {
  return role === "LEARNER" ? "/dashboard" : "/trainer";
}
