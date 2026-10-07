import { env } from "@/lib/env";
import { GroqProvider } from "./groq";
import { RateLimitError, type ChatMessage } from "./provider";

export type AIResult<T> = { output: T; raw: unknown; model: string };

export class AIOutputError extends Error {
  constructor(
    message: string,
    public raw: unknown,
    public model: string,
  ) {
    super(message);
  }
}

const MAX_ATTEMPTS = 3;
const MAX_RATE_LIMIT_WAIT_MS = 15_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Calls the model and parses its JSON with `parse`. Retries on rate limits (waiting as told),
 * on network errors and on malformed output, alternating primary and fallback models.
 */
export async function completeJSON<T>(messages: ChatMessage[], parse: (raw: unknown) => T): Promise<AIResult<T>> {
  const { GROQ_API_KEY, GROQ_MODEL, GROQ_FALLBACK_MODEL } = env();
  const provider = new GroqProvider(GROQ_API_KEY);
  const models = [GROQ_MODEL, GROQ_FALLBACK_MODEL || GROQ_MODEL];

  const errors: string[] = [];
  let lastBadOutput: AIOutputError | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const model = models[attempt % models.length];
    let raw: unknown;
    try {
      raw = await provider.completeJSON(messages, model);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      if (err instanceof RateLimitError && err.retryAfterMs !== null && err.retryAfterMs <= MAX_RATE_LIMIT_WAIT_MS) {
        await sleep(err.retryAfterMs + 250);
      }
      continue;
    }

    try {
      return { output: parse(raw), raw, model };
    } catch (err) {
      lastBadOutput = new AIOutputError("AI returned JSON in an unexpected shape", raw, model);
      errors.push(`${model}: unexpected output shape (${err instanceof Error ? err.message.slice(0, 200) : err})`);
    }
  }

  // Prefer reporting a bad-shape result (we did reach the model) over transport errors.
  if (lastBadOutput) throw lastBadOutput;
  throw new Error(errors.join(" | "));
}

export type { ChatMessage } from "./provider";
