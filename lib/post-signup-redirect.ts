import { trackEvent } from "@/lib/analytics";

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
  const destination = await resolvePostSignupDestination();
  trackEvent("signup_completed", { destination });
  navigate(destination, { refresh: true });
}
