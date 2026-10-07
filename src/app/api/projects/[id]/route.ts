import { withHandler } from "@/lib/http";
import { requireUser } from "@/modules/auth/session";
import { projectService } from "@/modules/projects/project.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return projectService.getById(user, id);
});
