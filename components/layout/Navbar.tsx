"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Settings } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type DashboardNavbarProps = {
  credits: number;
  userEmail: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  onSignOut?: () => void;
};

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/image", label: "Create" },
  { href: "/video", label: "Tools" },
  { href: "/dashboard/history", label: "Gallery" }
] as const;

function avatarInitial(displayName: string | null, email: string | null): string {
  const fromName = displayName?.trim();
  if (fromName) return fromName.charAt(0).toUpperCase();
  const fromEmail = email?.trim();
  if (fromEmail) return fromEmail.charAt(0).toUpperCase();
  return "?";
}

export function DashboardNavbar({
  credits,
  userEmail,
  displayName,
  avatarUrl,
  onSignOut
}: DashboardNavbarProps) {
  const initial = avatarInitial(displayName, userEmail);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const signedIn = Boolean(userEmail);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-surface-border bg-surface-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[100vw] items-center justify-between gap-4 px-6 lg:px-8">
        <Link href="/dashboard" className="font-heading text-lg font-bold tracking-tight text-white">
          Zorixa
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex"
          aria-label="Main"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-heading text-sm font-semibold text-white/60 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="hidden items-center gap-2 rounded-full border border-surface-border bg-surface-card px-3 py-1 sm:flex"
            title="Credits balance"
          >
            <span className="font-heading text-xs font-medium text-white/50">Credits</span>
            <span className="font-heading text-sm font-bold tabular-nums text-white">{credits}</span>
          </div>

          <Link
            href="/dashboard/billing"
            className="rounded-full bg-brand px-5 py-2 font-heading text-sm font-semibold text-white transition-colors hover:bg-brand-light"
          >
            Buy credits
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-surface-border bg-surface-elevated font-heading text-sm font-semibold text-white transition-colors hover:border-white/30"
              title={userEmail ?? "Account"}
              aria-haspopup="true"
              aria-expanded={open}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- external avatar URL
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <span aria-hidden>{initial}</span>
              )}
            </button>

            {open ? (
              <div
                className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] overflow-hidden rounded-xl border border-white/[0.08] bg-zorixa-bg shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
                role="menu"
              >
                <div className="flex items-center gap-2 px-5 pb-2 pt-4">
                  <Link
                    href="/dashboard/billing"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="rounded-[20px] bg-white px-4 py-1.5 text-sm font-normal text-black transition-opacity hover:opacity-90"
                  >
                    View Plans
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    role="menuitem"
                    aria-label="Settings"
                    onClick={() => setOpen(false)}
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-white/[0.15] bg-zorixa-bg-secondary/80 text-white transition-opacity hover:opacity-80"
                  >
                    <Settings className="size-4" strokeWidth={1.75} aria-hidden />
                  </Link>
                </div>

                <nav className="flex flex-col pb-2 pt-1" aria-label="Account">
                  <Link
                    href="/dashboard/billing"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="px-5 py-3 text-sm font-normal text-white transition-opacity hover:opacity-70"
                  >
                    Subscription
                  </Link>
                  <Link
                    href="/dashboard/history"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="px-5 py-3 text-sm font-normal text-white transition-opacity hover:opacity-70"
                  >
                    Usage
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="px-5 py-3 text-sm font-normal text-white transition-opacity hover:opacity-70"
                  >
                    API Access
                  </Link>
                  <Link
                    href="/"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="px-5 py-3 text-sm font-normal text-white transition-opacity hover:opacity-70"
                  >
                    Support
                  </Link>

                  {signedIn && onSignOut ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setOpen(false);
                        onSignOut();
                      }}
                      className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-normal text-white transition-opacity hover:opacity-70"
                    >
                      <ArrowRight className="size-4 shrink-0 opacity-90" aria-hidden />
                      Sign out
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-5 py-3 text-sm font-normal text-white transition-opacity hover:opacity-70"
                    >
                      <ArrowRight className="size-4 shrink-0 opacity-90" aria-hidden />
                      Sign In
                    </Link>
                  )}
                </nav>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Standalone navbar for studio routes: loads profile/credits client-side and wires sign-out.
 * Supports legacy `{ fixed, dashboardAuthBar }` props (ignored; bar is always fixed like DashboardNavbar).
 */
export function Navbar({
  fixed: _fixed,
  dashboardAuthBar: _dashboardAuthBar
}: {
  fixed?: boolean;
  dashboardAuthBar?: boolean;
} = {}) {
  const router = useRouter();
  const [credits, setCredits] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    void (async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        setCredits(0);
        setUserEmail(null);
        setDisplayName(null);
        setAvatarUrl(null);
        return;
      }

      setUserEmail(user.email ?? null);
      const meta = user.user_metadata as { avatar_url?: string; full_name?: string; name?: string } | undefined;
      setAvatarUrl(typeof meta?.avatar_url === "string" ? meta.avatar_url : null);

      const { data: profile } = await supabase
        .from("users_profiles")
        .select("credits_balance, full_name")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      setCredits(profile?.credits_balance ?? 0);
      setDisplayName(
        profile?.full_name ??
          (typeof meta?.full_name === "string" ? meta.full_name : null) ??
          (typeof meta?.name === "string" ? meta.name : null)
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const onSignOut = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
  }, [router]);

  return (
    <DashboardNavbar
      credits={credits}
      userEmail={userEmail}
      displayName={displayName}
      avatarUrl={avatarUrl}
      onSignOut={onSignOut}
    />
  );
}
