import { NextResponse } from "next/server";
import { AppError } from "./errors";

type Handler<C> = (req: Request, ctx: C) => Promise<unknown>;

/** Wraps an API route: returns JSON on success and maps AppError to a status code. */
export function withHandler<C = unknown>(handler: Handler<C>, successStatus = 200) {
  return async (req: Request, ctx: C) => {
    try {
      const result = await handler(req, ctx);
      return NextResponse.json(result ?? { ok: true }, { status: successStatus });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json({ error: err.message, issues: err.issues }, { status: err.status });
      }
      console.error("[api] unexpected error", err);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}
