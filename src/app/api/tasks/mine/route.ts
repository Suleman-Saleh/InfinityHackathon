import { withHandler } from "@/lib/http";
import { requireUser } from "@/modules/auth/session";
import { taskService } from "@/modules/tasks/task.service";

export const GET = withHandler(async () => taskService.mine(await requireUser("AGENT")));
