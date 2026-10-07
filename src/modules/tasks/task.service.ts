import { toDateString } from "@/lib/format";
import type { CurrentUser, MyTaskDTO, TaskDTO } from "@/types";
import { taskFilterFor } from "./task.policy";
import { taskRepo, type TaskRow } from "./task.repo";

export function toTaskDTO(t: TaskRow): TaskDTO {
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    description: t.description,
    deadline: toDateString(t.deadline),
    estimatedHours: t.estimatedHours,
    assignee: t.assignee,
  };
}

export const taskService = {
  /** Tasks of one project, filtered by role. Caller must already have checked project access. */
  async forProject(user: CurrentUser, projectId: string): Promise<TaskDTO[]> {
    const rows = await taskRepo.findMany(taskFilterFor(user, projectId));
    return rows.map(toTaskDTO);
  },

  /** An agent's own tasks across all projects. */
  async mine(user: CurrentUser): Promise<MyTaskDTO[]> {
    const rows = await taskRepo.findMany({ assigneeId: user.id });
    return rows.map((t) => ({ ...toTaskDTO(t), project: t.project }));
  },
};
