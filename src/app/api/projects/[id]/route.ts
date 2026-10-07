import { readJson, withHandler } from "@/lib/http";
import { requireUser } from "@/modules/auth/session";
import { projectEditService } from "@/modules/projects/project.edit.service";
import { projectService } from "@/modules/projects/project.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return projectService.getById(user, id);
});

/** Correct project details (name, description, deadline; manager is admin-only). */
export const PATCH = withHandler<Ctx>(async (req, { params }) => {
  const user = await requireUser("ADMIN", "MANAGER");
  const { id } = await params;
  return projectEditService.updateProject(user, id, await readJson(req));
});
