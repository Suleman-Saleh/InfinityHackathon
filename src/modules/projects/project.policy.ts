import type { Prisma } from "@prisma/client";
import type { CurrentUser } from "@/types";

/** Who may correct a project and its tasks: the admin, or the manager of that project. */
export function canEditProject(user: CurrentUser, managerId: string): boolean {
  return user.role === "ADMIN" || (user.role === "MANAGER" && managerId === user.id);
}

/** Which projects a user may see. Every project query goes through this filter. */
export function projectFilterFor(user: CurrentUser): Prisma.ProjectWhereInput {
  switch (user.role) {
    case "ADMIN":
      return {};
    case "MANAGER":
      return { managerId: user.id };
    case "AGENT":
      return { tasks: { some: { assigneeId: user.id } } };
  }
}
