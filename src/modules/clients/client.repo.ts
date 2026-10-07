import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type Tx = Prisma.TransactionClient;

const clientInclude = {
  projects: { select: { managerId: true } },
} satisfies Prisma.ClientInclude;

export type ClientRow = Prisma.ClientGetPayload<{ include: typeof clientInclude }>;

export const clientRepo = {
  findMany: (where: Prisma.ClientWhereInput) =>
    prisma.client.findMany({ where, include: clientInclude, orderBy: { name: "asc" } }),

  findFirst: (where: Prisma.ClientWhereInput) => prisma.client.findFirst({ where, include: clientInclude }),

  exists: async (id: string) => (await prisma.client.count({ where: { id } })) > 0,

  findByNameInsensitive: (name: string, excludeId?: string) =>
    prisma.client.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    }),

  /** Updates the client and keeps the denormalized Project.clientName in sync. */
  update: (id: string, data: Prisma.ClientUpdateInput) =>
    prisma.$transaction(async (tx) => {
      const client = await tx.client.update({ where: { id }, data, include: clientInclude });
      if (typeof data.name === "string") {
        await tx.project.updateMany({ where: { clientId: id }, data: { clientName: client.name } });
      }
      return client;
    }),

  /** Finds a client by name (case-insensitive) or creates it. Used inside the transcript transaction. */
  async findOrCreateByName(tx: Tx, name: string) {
    const existing = await tx.client.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
    return existing ?? tx.client.create({ data: { name } });
  },
};
