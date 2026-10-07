import type { ApiError } from "@/types";

/** Error thrown by api() with the HTTP status and any validation issues from the server. */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public issues: string[] = [],
  ) {
    super(message);
  }
}

type Options = { method?: "GET" | "POST" | "PATCH"; body?: unknown };

/** Calls our own API with the session cookie. Throws ApiRequestError on any non-2xx response. */
export async function api<T>(path: string, { method = "GET", body }: Options = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiRequestError("Could not reach the server. Check your connection and try again.", 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data ?? {}) as Partial<ApiError>;
    if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/api/auth/login")) {
      // Session expired: a full reload to the login page clears all client state.
      window.location.replace("/login");
    }
    throw new ApiRequestError(err.error ?? `Request failed (${res.status})`, res.status, err.issues ?? []);
  }
  return data as T;
}
