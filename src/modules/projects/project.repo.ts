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
};
