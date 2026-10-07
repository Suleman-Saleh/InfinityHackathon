import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const taskInclude = {
  assignee: { select: { id: true, name: true } },
  project: {
    select: { id: true, name: true, clientName: true, manager: { select: { id: true, name: true } } },
  },
} satisfies Prisma.TaskInclude;

export type TaskRow = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export const taskRepo = {
  findMany: (where: Prisma.TaskWhereInput) =>
    prisma.task.findMany({ where, include: taskInclude, orderBy: [{ deadline: "asc" }, { title: "asc" }] }),

  /** IDs of the agents who have at least one task in a project managed by this manager. */
  assigneeIdsForManager: async (managerId: string) =>
    (
      await prisma.task.findMany({
        where: { project: { managerId } },
        select: { assigneeId: true },
        distinct: ["assigneeId"],
      })
    ).map((t) => t.assigneeId),
};
