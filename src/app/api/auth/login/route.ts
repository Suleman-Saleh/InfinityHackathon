import { readJson, withHandler } from "@/lib/http";
import { authService } from "@/modules/auth/auth.service";

export const POST = withHandler(async (req) => {
  const { email, password } = await readJson(req);
  const user = await authService.login(email, password);
  return { user };
});
