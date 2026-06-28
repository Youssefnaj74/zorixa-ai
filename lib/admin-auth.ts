import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseAdminEmails(): Set<string> {
  const raw = process.env.ZORIXA_ADMIN_EMAILS?.trim() ?? "";
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** Returns authenticated user id when email is listed in ZORIXA_ADMIN_EMAILS. */
export async function requireAdminUser(): Promise<{ userId: string; email: string } | null> {
  const allowlist = parseAdminEmails();
  if (allowlist.size === 0) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const email = user.email.trim().toLowerCase();
  if (!allowlist.has(email)) return null;

  return { userId: user.id, email };
}

export function isAdminEmailConfigured(): boolean {
  return parseAdminEmails().size > 0;
}
