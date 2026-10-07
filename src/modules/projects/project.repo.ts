import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const projectInclude = {
  manager: { select: { id: true, name: true } },
  tasks: { select: { estimatedHours: true } },
} satisfies Prisma.ProjectInclude;

export type ProjectRow = Prisma.ProjectGetPayload<{ include: typeof projectInclude }>;

export const projectRepo = {
  findMany: (where: Prisma.ProjectWhereInput) =>
    prisma.project.findMany({ where, include: projectInclude, orderBy: [{ deadline: "asc" }, { name: "asc" }] }),

  findFirst: (where: Prisma.ProjectWhereInput) => prisma.project.findFirst({ where, include: projectInclude }),

  /** Minimal fields needed to authorize and validate an edit. */
  findForEdit: (id: string) =>
    prisma.project.findUnique({ where: { id }, select: { id: true, managerId: true, deadline: true } }),

  /** Latest task deadline in the project (a project deadline may not move before it). */
  latestTaskDeadline: async (projectId: string, excludeTaskId?: string) =>
    (
      await prisma.task.aggregate({
        where: { projectId, ...(excludeTaskId ? { id: { not: excludeTaskId } } : {}) },
        _max: { deadline: true },
      })
    )._max.deadline,

  update: (id: string, data: Prisma.ProjectUncheckedUpdateInput) => prisma.project.update({ where: { id }, data }),
};
