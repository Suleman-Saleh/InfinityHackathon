import { withHandler } from "@/lib/http";
import { requireUser } from "@/modules/auth/session";
import { userService } from "@/modules/users/user.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler<Ctx>(async (_req, { params }) => {
  const viewer = await requireUser();
  const { id } = await params;
  return userService.member(viewer, id);
});
