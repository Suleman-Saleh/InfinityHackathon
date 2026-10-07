import { withHandler } from "@/lib/http";
import { requireUser } from "@/modules/auth/session";
import { projectService } from "@/modules/projects/project.service";

export const GET = withHandler(async () => projectService.list(await requireUser()));
