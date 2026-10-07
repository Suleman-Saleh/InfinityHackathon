import { withHandler } from "@/lib/http";
import { requireUser } from "@/modules/auth/session";
import { clientService } from "@/modules/clients/client.service";

export const GET = withHandler(async () => clientService.list(await requireUser()));
