import type { Prisma } from "@prisma/client";
import type { CurrentUser } from "@/types";

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
