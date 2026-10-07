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
    const openable = await userService.openableMemberIds(viewer);
    if (openable !== "ALL" && !openable.includes(id)) {
      throw new ForbiddenError(
        viewer.role === "MANAGER"
          ? "Managers can only view their own profile and the agents working on their projects"
          : "Agents can only view their own profile",
      );
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

  /**
   * Whose team profile a user may open: the admin anyone; a manager themselves and the agents
   * with tasks in their projects; an agent only themselves.
   */
  async openableMemberIds(viewer: CurrentUser): Promise<string[] | "ALL"> {
    if (viewer.role === "ADMIN") return "ALL";
    if (viewer.role === "AGENT") return [viewer.id];
    return [viewer.id, ...(await taskRepo.assigneeIdsForManager(viewer.id))];
  },
};
