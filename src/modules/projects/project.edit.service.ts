import { z } from "zod";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { fromDateString, toDateString } from "@/lib/format";
import { taskRepo } from "@/modules/tasks/task.repo";
import { userRepo } from "@/modules/users/user.repo";
import type { CurrentUser, ProjectDetailDTO } from "@/types";
import { canEditProject } from "./project.policy";
import { projectRepo } from "./project.repo";
import { projectService } from "./project.service";

// Manual corrections after AI extraction. Same rules as the transcript validation:
// owner must be an AGENT, manager a MANAGER, hours > 0, task deadline ≤ project deadline.

const FIX = "Please fix the following and save again.";

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Deadline must be a date (YYYY-MM-DD)")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "Deadline is not a valid date");

const taskSchema = z
  .object({
    title: z.string().trim().min(1, "Task title is required").max(200),
    description: z.string().trim().max(2000),
    assigneeId: z.string().min(1, "Choose who owns this task"),
    deadline: date,
    estimatedHours: z.coerce.number().positive("Estimated hours must be more than 0").max(1000, "Estimated hours looks too large"),
  })
  .strict();

const projectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(200),
    description: z.string().trim().max(2000),
    deadline: date,
    managerId: z.string().min(1),
  })
  .partial()
  .strict();

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const r = schema.safeParse(input);
  if (!r.success) throw new ValidationError(FIX, r.error.issues.map((i) => i.message));
  return r.data;
}

async function assertRole(userId: string, role: "AGENT" | "MANAGER", label: string) {
  const u = await userRepo.findPublicById(userId);
  if (!u || u.role !== role) throw new ValidationError(FIX, [`${label} must be an existing ${role === "AGENT" ? "developer agent" : "manager"}.`]);
}

function assertWithinProject(taskDeadline: string, projectDeadline: Date) {
  const pd = toDateString(projectDeadline);
  if (taskDeadline > pd) throw new ValidationError(FIX, [`Task deadline ${taskDeadline} is after the project deadline ${pd}.`]);
}

async function editableProject(user: CurrentUser, projectId: string) {
  const project = await projectRepo.findForEdit(projectId);
  if (!project) throw new NotFoundError("Project not found");
  if (!canEditProject(user, project.managerId)) {
    throw new ForbiddenError("Only the administrator or this project's manager can edit it");
  }
  return project;
}

async function editableTask(user: CurrentUser, taskId: string) {
  const task = await taskRepo.findForEdit(taskId);
  if (!task) throw new NotFoundError("Task not found");
  if (!canEditProject(user, task.project.managerId)) {
    throw new ForbiddenError("Only the administrator or this project's manager can edit its tasks");
  }
  return task;
}

export const projectEditService = {
  async updateProject(user: CurrentUser, projectId: string, input: unknown): Promise<ProjectDetailDTO> {
    const project = await editableProject(user, projectId);
    const data = parse(projectSchema, input);

    if (data.managerId !== undefined && data.managerId !== project.managerId) {
      if (user.role !== "ADMIN") throw new ForbiddenError("Only the administrator can change a project's manager");
      await assertRole(data.managerId, "MANAGER", "Project manager");
    }
    if (data.deadline !== undefined) {
      const latest = await projectRepo.latestTaskDeadline(projectId);
      if (latest && toDateString(latest) > data.deadline) {
        throw new ValidationError(FIX, [
          `Project deadline ${data.deadline} is before a task deadline (${toDateString(latest)}). Move the task first.`,
        ]);
      }
    }

    await projectRepo.update(projectId, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.deadline !== undefined && { deadline: fromDateString(data.deadline) }),
      ...(data.managerId !== undefined && { managerId: data.managerId }),
    });
    // A manager who handed the project to someone else (admin only) would lose access; admins never do.
    return projectService.getById(user, projectId);
  },

  async createTask(user: CurrentUser, projectId: string, input: unknown): Promise<ProjectDetailDTO> {
    const project = await editableProject(user, projectId);
    const data = parse(taskSchema, input);
    await assertRole(data.assigneeId, "AGENT", "Task owner");
    assertWithinProject(data.deadline, project.deadline);

    await taskRepo.create({ ...data, projectId, deadline: fromDateString(data.deadline) });
    return projectService.getById(user, projectId);
  },

  async updateTask(user: CurrentUser, taskId: string, input: unknown): Promise<ProjectDetailDTO> {
    const task = await editableTask(user, taskId);
    const data = parse(taskSchema.partial(), input);
    if (data.assigneeId !== undefined) await assertRole(data.assigneeId, "AGENT", "Task owner");
    if (data.deadline !== undefined) assertWithinProject(data.deadline, task.project.deadline);

    await taskRepo.update(taskId, {
      ...data,
      ...(data.deadline !== undefined && { deadline: fromDateString(data.deadline) }),
    });
    return projectService.getById(user, task.projectId);
  },

  async deleteTask(user: CurrentUser, taskId: string): Promise<ProjectDetailDTO> {
    const task = await editableTask(user, taskId);
    await taskRepo.delete(taskId);
    return projectService.getById(user, task.projectId);
  },
};
