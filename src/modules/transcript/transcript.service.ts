import type { Prisma } from "@prisma/client";
import { AIOutputError, completeJSON, type AIResult } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { ForbiddenError, UpstreamError, ValidationError } from "@/lib/errors";
import { fromDateString } from "@/lib/format";
import { clientRepo } from "@/modules/clients/client.repo";
import { toProjectDTO } from "@/modules/projects/project.service";
import { userService } from "@/modules/users/user.service";
import type { CurrentUser, TranscriptResultDTO } from "@/types";
import { buildMessages } from "./transcript.prompt";
import { aiDraftSchema, type AIDraft } from "./transcript.schema";
import { validateDraft } from "./transcript.validate";

const MAX_TRANSCRIPT_CHARS = 50_000;

export const transcriptService = {
  async createFromTranscript(user: CurrentUser, rawTranscript: unknown): Promise<TranscriptResultDTO> {
    if (user.role !== "ADMIN") throw new ForbiddenError("Only the administrator can create projects from a transcript");

    const transcript = typeof rawTranscript === "string" ? rawTranscript.trim() : "";
    if (!transcript) throw new ValidationError("Please paste a meeting transcript first.");
    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
      throw new ValidationError(`Transcript is too long (max ${MAX_TRANSCRIPT_CHARS.toLocaleString()} characters).`);
    }

    const directory = await userService.aiDirectory();
    const today = new Date().toISOString().slice(0, 10);

    // 1–2. AI extraction + shape check (retries with fallback model on failure)
    let ai: AIResult<AIDraft>;
    try {
      ai = await completeJSON(buildMessages(transcript, directory, today), (raw) => aiDraftSchema.parse(raw));
    } catch (err) {
      if (err instanceof AIOutputError) {
        const issues = ["The AI returned an unexpected format. Please try again."];
        await logRun(user.id, transcript, err.raw, err.model, "INVALID", issues);
        throw new ValidationError("Could not read the AI result", issues);
      }
      const reason = err instanceof Error ? err.message : String(err);
      await logRun(user.id, transcript, null, null, "FAILED", [reason]);
      console.error("[transcript] AI call failed:", reason);
      throw new UpstreamError(
        /429/.test(reason)
          ? "The AI service is busy (rate limit reached). Please wait about a minute and try again."
          : "The AI service is unavailable right now. Please try again in a moment.",
      );
    }

    // 3. Business validation
    const result = validateDraft(ai.output, directory);
    if (!result.ok) {
      await logRun(user.id, transcript, ai.raw, ai.model, "INVALID", result.issues);
      throw new ValidationError(
        "Some required information could not be resolved. Please correct the transcript and try again. Nothing was saved.",
        result.issues,
      );
    }

    // 4. All-or-nothing save
    const created = await prisma.$transaction(async (tx) => {
      const run = await tx.transcriptRun.create({
        data: {
          createdById: user.id,
          transcript,
          aiOutput: ai.raw as Prisma.InputJsonValue,
          model: ai.model,
          status: "SUCCESS",
          issues: [],
        },
      });

      const projects = [];
      for (const p of result.projects) {
        // Reuse the existing client record (case-insensitive) or create a new one.
        const client = await clientRepo.findOrCreateByName(tx, p.clientName);
        projects.push(
          await tx.project.create({
            data: {
              name: p.name,
              clientName: client.name,
              clientId: client.id,
              description: p.description,
              managerId: p.managerId,
              deadline: fromDateString(p.deadline),
              transcriptRunId: run.id,
              tasks: {
                create: p.tasks.map((t) => ({
                  title: t.title,
                  description: t.description,
                  assigneeId: t.assigneeId,
                  deadline: fromDateString(t.deadline),
                  estimatedHours: t.estimatedHours,
                })),
              },
            },
            include: { manager: { select: { id: true, name: true } }, tasks: { select: { estimatedHours: true } } },
          }),
        );
      }
      return { runId: run.id, projects };
    }, { timeout: 20_000 });

    const projects = created.projects.map(toProjectDTO);
    return {
      runId: created.runId,
      model: ai.model,
      projects,
      taskCount: projects.reduce((n, p) => n + p.taskCount, 0),
    };
  },
};

async function logRun(
  userId: string,
  transcript: string,
  aiOutput: unknown,
  model: string | null,
  status: "INVALID" | "FAILED",
  issues: string[],
) {
  try {
    await prisma.transcriptRun.create({
      data: {
        createdById: userId,
        transcript,
        aiOutput: (aiOutput ?? undefined) as Prisma.InputJsonValue | undefined,
        model,
        status,
        issues,
      },
    });
  } catch (err) {
    console.error("[transcript] failed to log run", err);
  }
}
