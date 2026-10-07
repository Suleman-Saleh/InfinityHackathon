export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AIProvider {
  readonly name: string;
  /** Sends messages and returns the parsed JSON object from the model's reply. */
  completeJSON(messages: ChatMessage[], model: string): Promise<unknown>;
}
