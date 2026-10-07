import { withHandler } from "@/lib/http";
import { requireUser } from "@/modules/auth/session";
import { userService } from "@/modules/users/user.service";

export const GET = withHandler(async () => {
  await requireUser();
  return userService.list();
});
