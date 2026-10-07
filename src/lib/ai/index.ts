import { env } from "@/lib/env";
import { GroqProvider } from "./groq";
import type { ChatMessage } from "./provider";

export type AIResult = { output: unknown; model: string };

/** Calls the primary model, then the fallback model if the first one fails. */
export async function completeJSON(messages: ChatMessage[]): Promise<AIResult> {
  const { GROQ_API_KEY, GROQ_MODEL, GROQ_FALLBACK_MODEL } = env();
  const provider = new GroqProvider(GROQ_API_KEY);
  const models = [GROQ_MODEL, GROQ_FALLBACK_MODEL].filter((m): m is string => !!m);

  const errors: string[] = [];
  for (const model of models) {
    try {
      return { output: await provider.completeJSON(messages, model), model };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  throw new Error(errors.join(" | "));
}

export type { ChatMessage } from "./provider";
