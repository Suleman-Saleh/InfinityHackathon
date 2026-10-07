import { z } from "zod";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { projectService } from "@/modules/projects/project.service";
import type { ClientDTO, ClientDetailDTO, CurrentUser, PersonRef, ProjectDTO } from "@/types";
import { canEditClient, clientFilterFor } from "./client.policy";
import { clientRepo, type ClientRow } from "./client.repo";

const text = (max: number) => z.string().trim().max(max);

const updateSchema = z
  .object({
    name: text(120).min(1, "Client name cannot be empty"),
    industry: text(120),
    contactName: text(120),
    contactEmail: z.union([z.literal(""), z.string().trim().max(200).email("Contact email is not a valid email address")]),
    contactPhone: text(40).regex(/^[0-9+()\-\s.]*$/, "Phone may only contain digits, spaces and + ( ) - ."),
    website: text(200),
    notes: text(2000),
  })
  .partial()
  .strict();

function toClientDTO(c: ClientRow, user: CurrentUser, visibleProjects: ProjectDTO[]): ClientDTO {
  const managers = new Map<string, PersonRef>();
  for (const p of visibleProjects) managers.set(p.manager.id, p.manager);
  const deadlines = visibleProjects.map((p) => p.deadline).sort();

  return {
    id: c.id,
    name: c.name,
    industry: c.industry,
    contactName: c.contactName,
    contactEmail: c.contactEmail,
    contactPhone: c.contactPhone,
    website: c.website,
    // Notes are internal relationship info: admin and managers only, never sent to agents.
    notes: user.role === "AGENT" ? "" : c.notes,
    projectCount: visibleProjects.length,
    taskCount: visibleProjects.reduce((n, p) => n + p.taskCount, 0),
    totalHours: visibleProjects.reduce((n, p) => n + p.totalHours, 0),
    nextDeadline: deadlines[0] ?? null,
    managers: [...managers.values()],
    canEdit: canEditClient(user, c.projects.map((p) => p.managerId)),
    updatedAt: c.updatedAt.toISOString(),
  };
}

/** Projects the user can see, grouped by client. Reuses project access rules (agents get their own task counts). */
async function visibleProjectsByClient(user: CurrentUser) {
  const projects = await projectService.list(user);
  const byClient = new Map<string, ProjectDTO[]>();
  for (const p of projects) {
    if (!p.clientId) continue;
    byClient.set(p.clientId, [...(byClient.get(p.clientId) ?? []), p]);
  }
  return byClient;
}

export const clientService = {
  async list(user: CurrentUser): Promise<ClientDTO[]> {
    const [clients, byClient] = await Promise.all([clientRepo.findMany(clientFilterFor(user)), visibleProjectsByClient(user)]);
    return clients.map((c) => toClientDTO(c, user, byClient.get(c.id) ?? []));
  },

  async getById(user: CurrentUser, id: string): Promise<ClientDetailDTO> {
    const client = await clientRepo.findFirst({ AND: [{ id }, clientFilterFor(user)] });
    if (!client) {
      throw (await clientRepo.exists(id))
        ? new ForbiddenError("You do not have access to this client")
        : new NotFoundError("Client not found");
    }
    const projects = (await visibleProjectsByClient(user)).get(id) ?? [];
    return { ...toClientDTO(client, user, projects), projects };
  },

  async update(user: CurrentUser, id: string, input: unknown): Promise<ClientDetailDTO> {
    const current = await this.getById(user, id); // also enforces visibility
    if (!current.canEdit) throw new ForbiddenError("Only the administrator or this client's project manager can edit client details");

    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        "Please fix the following and save again.",
        parsed.error.issues.map((i) => i.message),
      );
    }
    const data = parsed.data;

    if (data.name !== undefined && data.name !== current.name) {
      if (user.role !== "ADMIN") throw new ForbiddenError("Only the administrator can rename a client");
      if (await clientRepo.findByNameInsensitive(data.name, id)) {
        throw new ValidationError("Please fix the following and save again.", [`A client named "${data.name}" already exists.`]);
      }
    }

    await clientRepo.update(id, data);
    return this.getById(user, id);
  },
};
