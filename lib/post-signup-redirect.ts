import { identifyAnalyticsUser, trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export const PRICING_WELCOME_PATH = "/pricing?welcome=1";

/** After login, land on pricing and immediately start Starter Pass checkout. */
export const STARTER_PASS_CHECKOUT_PATH = "/pricing?welcome=1&checkout=starter-pass";

/** Apply tokens from POST /api/auth/signup so the browser is actually logged in. */
export async function establishBrowserSessionFromSignup(tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
}): Promise<boolean> {
  const access_token = tokens.access_token?.trim();
  const refresh_token = tokens.refresh_token?.trim();
  if (!access_token || !refresh_token) return false;

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  return !error;
}

/** After signup, send users with no credits to pricing welcome. */
export async function resolvePostSignupDestination(): Promise<string> {
  try {
    const res = await fetch("/api/credits", { credentials: "include" });
    if (res.ok) {
      const body = (await res.json()) as { credits_balance?: number };
      if ((body.credits_balance ?? 0) <= 0) return PRICING_WELCOME_PATH;
      return "/dashboard";
    }
  } catch {
    /* fall through */
  }
  return PRICING_WELCOME_PATH;
}

export async function completeSignupNavigation(
  navigate: (path: string, opts?: { refresh?: boolean }) => void
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user?.id) {
    identifyAnalyticsUser(user.id, { email: user.email ?? undefined });
  }

  const destination = await resolvePostSignupDestination();
  trackEvent(AnalyticsEvents.SIGNUP_COMPLETED, { destination });
  navigate(destination, { refresh: true });
}
