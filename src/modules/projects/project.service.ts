import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { toDateString } from "@/lib/format";
import { taskService } from "@/modules/tasks/task.service";
import type { CurrentUser, ProjectDTO, ProjectDetailDTO } from "@/types";
import { projectFilterFor } from "./project.policy";
import { projectRepo, type ProjectRow } from "./project.repo";

export function toProjectDTO(p: ProjectRow): ProjectDTO {
  return {
    id: p.id,
    name: p.name,
    clientName: p.clientName,
    clientId: p.clientId,
    description: p.description,
    deadline: toDateString(p.deadline),
    manager: p.manager,
    taskCount: p.tasks.length,
    totalHours: p.tasks.reduce((sum, t) => sum + t.estimatedHours, 0),
  };
}

export const projectService = {
  async list(user: CurrentUser): Promise<ProjectDTO[]> {
    const rows = await projectRepo.findMany(projectFilterFor(user));
    const projects = rows.map(toProjectDTO);
    if (user.role !== "AGENT") return projects;

    // Agents only see counts/hours for their own tasks.
    const mine = await prisma.task.groupBy({
      by: ["projectId"],
      where: { assigneeId: user.id },
      _count: true,
      _sum: { estimatedHours: true },
    });
    const byProject = new Map(mine.map((m) => [m.projectId, m]));
    return projects.map((p) => ({
      ...p,
      taskCount: byProject.get(p.id)?._count ?? 0,
      totalHours: byProject.get(p.id)?._sum.estimatedHours ?? 0,
    }));
  },

  async getById(user: CurrentUser, id: string): Promise<ProjectDetailDTO> {
    const visible = await projectRepo.findFirst({ AND: [{ id }, projectFilterFor(user)] });
    if (!visible) {
      // Distinguish "does not exist" from "not yours" without leaking any details.
      const exists = await prisma.project.count({ where: { id } });
      throw exists ? new ForbiddenError("You do not have access to this project") : new NotFoundError("Project not found");
    }

    const tasks = await taskService.forProject(user, id);
    return {
      ...toProjectDTO(visible),
      taskCount: tasks.length,
      totalHours: tasks.reduce((sum, t) => sum + t.estimatedHours, 0),
      tasks,
    };
  },
};
