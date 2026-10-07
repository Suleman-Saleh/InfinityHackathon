import { readJson, withHandler } from "@/lib/http";
import { requireUser } from "@/modules/auth/session";
import { projectEditService } from "@/modules/projects/project.edit.service";

type Ctx = { params: Promise<{ id: string }> };

/** Add a task the AI missed. Returns the updated project. */
export const POST = withHandler<Ctx>(async (req, { params }) => {
  const user = await requireUser("ADMIN", "MANAGER");
  const { id } = await params;
  return projectEditService.createTask(user, id, await readJson(req));
}, 201);
