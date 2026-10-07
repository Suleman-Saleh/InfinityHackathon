import { readJson, withHandler } from "@/lib/http";
import { requireUser } from "@/modules/auth/session";
import { transcriptService } from "@/modules/transcript/transcript.service";

// AI calls can take a while on the free tier.
export const maxDuration = 60;

export const POST = withHandler(async (req) => {
  const user = await requireUser("ADMIN");
  const { transcript } = await readJson(req);
  return transcriptService.createFromTranscript(user, transcript);
}, 201);
