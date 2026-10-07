import { withHandler } from "@/lib/http";
import { destroySession } from "@/modules/auth/session";

export const POST = withHandler(async () => {
  await destroySession();
  return { ok: true };
});
