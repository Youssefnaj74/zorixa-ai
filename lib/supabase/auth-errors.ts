import type { AuthError } from "@supabase/supabase-js";

export function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!error) return false;
  const msg =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as AuthError).message)
      : String(error);
  return /refresh token/i.test(msg);
}
