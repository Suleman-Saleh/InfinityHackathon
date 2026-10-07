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

  /** A task with the parent project fields needed to authorize and validate an edit. */
  findForEdit: (id: string) =>
    prisma.task.findUnique({
      where: { id },
      select: { id: true, projectId: true, deadline: true, project: { select: { managerId: true, deadline: true } } },
    }),

  create: (data: Prisma.TaskUncheckedCreateInput) => prisma.task.create({ data }),

  update: (id: string, data: Prisma.TaskUncheckedUpdateInput) => prisma.task.update({ where: { id }, data }),

  delete: (id: string) => prisma.task.delete({ where: { id } }),

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
