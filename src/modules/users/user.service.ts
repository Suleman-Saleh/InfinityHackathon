import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { projectService } from "@/modules/projects/project.service";
import { taskVisibilityFor } from "@/modules/tasks/task.policy";
import { taskRepo } from "@/modules/tasks/task.repo";
import { toTaskDTO } from "@/modules/tasks/task.service";
import type { CurrentUser, TeamMemberDTO, UserDTO } from "@/types";
import { userRepo } from "./user.repo";

export type DirectoryEntry = Pick<UserDTO, "id" | "name" | "role" | "specialization" | "skills">;

export const userService = {
  /** Team directory for the UI. Never includes password hashes. */
  list: (): Promise<UserDTO[]> => userRepo.listPublic(),

  /** Directory sent to the AI: managers and agents only, no emails or passwords. */
  async aiDirectory(): Promise<DirectoryEntry[]> {
    const users = await userRepo.listPublic();
    return users
      .filter((u) => u.role !== "ADMIN")
      .map(({ id, name, role, specialization, skills }) => ({ id, name, role, specialization, skills }));
  },

  /**
   * One team member's profile and current work, limited to what the viewer may already see:
   * admin sees everything, a manager only their own projects, an agent only their own tasks.
   */
  async member(viewer: CurrentUser, id: string): Promise<TeamMemberDTO> {
    // Agents may only open their own profile, never a manager's or another agent's.
    if (viewer.role === "AGENT" && viewer.id !== id) {
      throw new ForbiddenError("Agents can only view their own profile");
    }

    const user = await userRepo.findPublicById(id);
    if (!user) throw new NotFoundError("Team member not found");

    const projects =
      user.role === "MANAGER" ? (await projectService.list(viewer)).filter((p) => p.manager.id === user.id) : [];

    const tasks =
      user.role === "AGENT"
        ? (await taskRepo.findMany({ AND: [{ assigneeId: user.id }, taskVisibilityFor(viewer)] })).map((t) => ({
            ...toTaskDTO(t),
            project: t.project,
          }))
        : [];

    return { user, projects, tasks, limited: viewer.role !== "ADMIN" && viewer.id !== user.id };
  },
};
