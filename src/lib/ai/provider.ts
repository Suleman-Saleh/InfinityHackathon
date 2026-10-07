export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AIProvider {
  readonly name: string;
  /** Sends messages and returns the parsed JSON object from the model's reply. */
  completeJSON(messages: ChatMessage[], model: string): Promise<unknown>;
}

/** Thrown when the provider rate-limits us; retryAfterMs says how long to wait, if known. */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfterMs: number | null,
  ) {
    super(message);
  }
}
