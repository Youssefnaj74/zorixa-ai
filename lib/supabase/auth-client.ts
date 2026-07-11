import type { User } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isInvalidRefreshTokenError } from "@/lib/supabase/auth-errors";

export { isInvalidRefreshTokenError } from "@/lib/supabase/auth-errors";

/** Clear broken local auth cookies after an expired / missing refresh token. */
export async function clearStaleBrowserSession(): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut({ scope: "local" });
}

/** Client getUser that recovers from stale refresh tokens without surfacing console errors. */
export async function getBrowserUserSafe(): Promise<User | null> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (!error) return user;

  if (isInvalidRefreshTokenError(error)) {
    await clearStaleBrowserSession();
  }

  return null;
}
