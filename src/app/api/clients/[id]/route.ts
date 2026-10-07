import { readJson, withHandler } from "@/lib/http";
import { requireUser } from "@/modules/auth/session";
import { clientService } from "@/modules/clients/client.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withHandler<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return clientService.getById(user, id);
});

export const PATCH = withHandler<Ctx>(async (req, { params }) => {
  const user = await requireUser("ADMIN", "MANAGER");
  const { id } = await params;
  return clientService.update(user, id, await readJson(req));
});
