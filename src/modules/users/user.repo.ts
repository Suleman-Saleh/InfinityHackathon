import { prisma } from "@/lib/db";

const publicFields = { id: true, name: true, email: true, role: true, specialization: true, skills: true } as const;

export const userRepo = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  findPublicById: (id: string) => prisma.user.findUnique({ where: { id }, select: publicFields }),

  listPublic: () =>
    prisma.user.findMany({ select: publicFields, orderBy: [{ role: "asc" }, { id: "asc" }] }),
};
