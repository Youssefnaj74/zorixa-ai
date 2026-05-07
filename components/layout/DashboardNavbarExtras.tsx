"use client";

import { LogOut } from "lucide-react";

import { useCredits } from "@/lib/hooks/use-credits";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Credits pill + sign out — used with `DashboardHomeLink` beside the logo. */
export function DashboardNavbarExtras() {
  const { credits, isLoading } = useCredits();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      <div
        className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 sm:flex"
        title="AI generation credits"
      >
        <span className="text-xs font-medium text-zorixa-muted">Credits</span>
        <span className="font-display text-sm font-bold tabular-nums text-white">
          {isLoading ? "…" : credits}
        </span>
      </div>

      <button
        type="button"
        onClick={signOut}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
      >
        <LogOut className="size-3.5" aria-hidden />
        Log out
      </button>
    </>
  );
}
