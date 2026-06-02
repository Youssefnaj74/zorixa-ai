import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isUserApiKeyToken, resolveUserIdFromApiKey } from "@/lib/user-api-keys";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ZorixaActor = {
  userId: string;
  via: "api_key" | "mcp" | "session";
};

export function readBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization")?.trim() ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token.length > 0) return token;
  }
  return null;
}

export function readZorixaMcpApiKey(request: Request): string | null {
  const bearer = readBearerToken(request);
  if (bearer) return bearer;
  const headerKey = request.headers.get("x-zorixa-mcp-key")?.trim();
  return headerKey && headerKey.length > 0 ? headerKey : null;
}

export function isZorixaMcpRequest(request: Request): boolean {
  const configured = env.zorixaMcpApiKey;
  if (!configured) return false;
  const provided = readZorixaMcpApiKey(request);
  if (!provided || isUserApiKeyToken(provided)) return false;
  return provided === configured;
}

export function readZorixaMcpUserIdHeader(request: Request): string | null {
  const raw =
    request.headers.get("x-zorixa-user-id")?.trim() ??
    request.headers.get("x-zorixa-user")?.trim() ??
    "";
  return UUID_RE.test(raw) ? raw : null;
}

/** Legacy MCP: shared secret + user header; returns user id when profile exists. */
export async function resolveZorixaMcpUserId(request: Request): Promise<string | null> {
  if (!isZorixaMcpRequest(request)) return null;
  const userId = readZorixaMcpUserIdHeader(request);
  if (!userId) return null;

  const { data, error } = await supabaseAdmin
    .from("users_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error && process.env.NODE_ENV === "development") {
    console.error("[zorixa-mcp-auth] profile lookup failed", error.message);
  }
  return data?.id ?? null;
}

/** Per-user API key or legacy MCP or Supabase session. */
export async function resolveZorixaActor(request: Request): Promise<ZorixaActor | null> {
  const bearer = readBearerToken(request);
  if (bearer && isUserApiKeyToken(bearer)) {
    const userId = await resolveUserIdFromApiKey(bearer);
    if (userId) return { userId, via: "api_key" };
    return null;
  }

  const mcpUserId = await resolveZorixaMcpUserId(request);
  if (mcpUserId) return { userId: mcpUserId, via: "mcp" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user) return { userId: user.id, via: "session" };

  return null;
}

/** Catalog / health checks: valid per-user key or legacy MCP secret. */
export async function isZorixaApiAuthorized(request: Request): Promise<boolean> {
  const bearer = readBearerToken(request);
  if (bearer && isUserApiKeyToken(bearer)) {
    const userId = await resolveUserIdFromApiKey(bearer);
    return userId !== null;
  }
  return isZorixaMcpRequest(request);
}

export function unauthorizedMcpResponse(): Response {
  return Response.json(
    {
      error:
        "Unauthorized. Use Authorization: Bearer <your Zorixa API key (zrx_live_…)>, or legacy MCP: Bearer <ZORIXA_MCP_API_KEY> + X-Zorixa-User-Id."
    },
    { status: 401 }
  );
}

export function unauthorizedApiResponse(): Response {
  return Response.json(
    {
      error:
        "Unauthorized. Sign in, or send Authorization: Bearer <your Zorixa API key> from Dashboard → API Access."
    },
    { status: 401 }
  );
}
