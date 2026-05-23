import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ZorixaActor = {
  userId: string;
  via: "mcp" | "session";
};

export function readZorixaMcpApiKey(request: Request): string | null {
  const auth = request.headers.get("authorization")?.trim() ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token.length > 0) return token;
  }
  const headerKey = request.headers.get("x-zorixa-mcp-key")?.trim();
  return headerKey && headerKey.length > 0 ? headerKey : null;
}

export function isZorixaMcpRequest(request: Request): boolean {
  const configured = env.zorixaMcpApiKey;
  if (!configured) return false;
  const provided = readZorixaMcpApiKey(request);
  return Boolean(provided && provided === configured);
}

export function readZorixaMcpUserIdHeader(request: Request): string | null {
  const raw =
    request.headers.get("x-zorixa-user-id")?.trim() ??
    request.headers.get("x-zorixa-user")?.trim() ??
    "";
  return UUID_RE.test(raw) ? raw : null;
}

/** Validates MCP key + user header; returns user id when profile exists. */
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

export async function resolveZorixaActor(request: Request): Promise<ZorixaActor | null> {
  const mcpUserId = await resolveZorixaMcpUserId(request);
  if (mcpUserId) return { userId: mcpUserId, via: "mcp" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user) return { userId: user.id, via: "session" };

  return null;
}

export function unauthorizedMcpResponse(): Response {
  return Response.json(
    {
      error:
        "Unauthorized. Send Authorization: Bearer <ZORIXA_MCP_API_KEY> and X-Zorixa-User-Id: <supabase user uuid>."
    },
    { status: 401 }
  );
}
