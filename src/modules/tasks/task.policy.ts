import type { Prisma } from "@prisma/client";
import type { CurrentUser } from "@/types";

/** Which tasks of a project a user may see. Agents never see other agents' tasks. */
export function taskFilterFor(user: CurrentUser, projectId: string): Prisma.TaskWhereInput {
  return user.role === "AGENT" ? { projectId, assigneeId: user.id } : { projectId };
}

/** Which tasks a user may see across all projects (used when looking at another person's work). */
export function taskVisibilityFor(user: CurrentUser): Prisma.TaskWhereInput {
  switch (user.role) {
    case "ADMIN":
      return {};
    case "MANAGER":
      return { project: { managerId: user.id } };
    case "AGENT":
      return { assigneeId: user.id };
  }
}
