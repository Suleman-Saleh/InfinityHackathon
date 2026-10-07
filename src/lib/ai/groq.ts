import { RateLimitError, type AIProvider, type ChatMessage } from "./provider";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export class GroqProvider implements AIProvider {
  readonly name = "groq";

  constructor(private apiKey: string) {}

  async completeJSON(messages: ChatMessage[], model: string): Promise<unknown> {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const message = `Groq ${model} returned ${res.status}: ${body.slice(0, 300)}`;
      if (res.status === 429) throw new RateLimitError(message, retryAfterMs(res, body));
      throw new Error(message);
    }

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error(`Groq ${model} returned an empty response`);

    return parseJSON(content);
  }
}

// Groq sends a retry-after header and/or "Please try again in 1.395s" in the body.
function retryAfterMs(res: Response, body: string): number | null {
  const header = Number(res.headers.get("retry-after"));
  if (Number.isFinite(header) && header > 0) return header * 1000;
  const match = body.match(/try again in ([\d.]+)(ms|s)/i);
  if (!match) return null;
  return Number(match[1]) * (match[2].toLowerCase() === "ms" ? 1 : 1000);
}

// Models sometimes wrap JSON in ``` fences or add text around it.
function parseJSON(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("AI response was not valid JSON");
  }
}
