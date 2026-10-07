import type { Prisma } from "@prisma/client";
import type { CurrentUser } from "@/types";

/** Which clients a user may see: those with at least one project the user can see. */
export function clientFilterFor(user: CurrentUser): Prisma.ClientWhereInput {
  switch (user.role) {
    case "ADMIN":
      return {};
    case "MANAGER":
      return { projects: { some: { managerId: user.id } } };
    case "AGENT":
      return { projects: { some: { tasks: { some: { assigneeId: user.id } } } } };
  }
}

/** Who may edit a client's details: the admin, or a manager of one of the client's projects. */
export function canEditClient(user: CurrentUser, managerIds: string[]): boolean {
  return user.role === "ADMIN" || (user.role === "MANAGER" && managerIds.includes(user.id));
}
