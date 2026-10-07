import { readJson, withHandler } from "@/lib/http";
import { requireUser } from "@/modules/auth/session";
import { projectEditService } from "@/modules/projects/project.edit.service";

type Ctx = { params: Promise<{ id: string }> };

/** Correct a task (title, description, owner, deadline, hours). Returns the updated project. */
export const PATCH = withHandler<Ctx>(async (req, { params }) => {
  const user = await requireUser("ADMIN", "MANAGER");
  const { id } = await params;
  return projectEditService.updateTask(user, id, await readJson(req));
});

/** Remove a task the AI should not have created. Returns the updated project. */
export const DELETE = withHandler<Ctx>(async (_req, { params }) => {
  const user = await requireUser("ADMIN", "MANAGER");
  const { id } = await params;
  return projectEditService.deleteTask(user, id);
});
