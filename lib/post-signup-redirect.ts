import { identifyAnalyticsUser, trackEvent } from "@/lib/analytics";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export const PRICING_WELCOME_PATH = "/pricing?welcome=1";

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
