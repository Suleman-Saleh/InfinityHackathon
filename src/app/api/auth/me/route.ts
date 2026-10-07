import { withHandler } from "@/lib/http";
import { requireUser } from "@/modules/auth/session";

export const GET = withHandler(async () => ({ user: await requireUser() }));
