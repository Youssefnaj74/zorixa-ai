"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Settings, CreditCard, BarChart2, Key, HelpCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

import { NavbarExplorePromptsLink } from "@/components/layout/NavbarExplorePromptsLink";
import { NavbarToolsLink } from "@/components/layout/NavbarToolsLink";
import { ZorixaLogo } from "@/components/layout/ZorixaLogo";
import { useScheduledAppRouterNavigation } from "@/lib/hooks/use-scheduled-app-router-navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type DashboardNavbarProps = {
  credits: number;
  userEmail: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  onSignOut?: () => void;
};

const navLinks = [
  { href: "/dashboard", label: "Dashboard", active: true, badge: null },
  { href: "/image", label: "Image", active: false, badge: null },
  { href: "/video", label: "Video", active: false, badge: null },
  { href: "/audio", label: "Speech", active: false, badge: "NEW" },
  { href: "/dashboard/history", label: "History", active: false, badge: null },
  { href: "/support", label: "Support", active: false, badge: null },
] as const;

const dropdownItems = [
  { label: "Subscription", href: "/pricing", icon: CreditCard },
  { label: "Usage", href: "/dashboard/usage", icon: BarChart2 },
  { label: "API Access", href: "/dashboard/api", icon: Key },
  { label: "Support", href: "/support", icon: HelpCircle },
];

export function DashboardNavbar({
  credits,
  userEmail,
  displayName: _displayName,
  avatarUrl: _avatarUrl,
  onSignOut
}: DashboardNavbarProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#080810]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 lg:px-8">

        <ZorixaLogo href="/dashboard" textClassName="text-lg font-extrabold" />

        {/* Nav links */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Fragment key={link.href + link.label}>
              <Link
                href={link.href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                  link.active ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                )}
              >
                {link.label}
                {link.badge && (
                  <span className="rounded-full bg-[#00e5ff] px-1.5 py-0.5 text-[10px] font-extrabold text-black leading-none">
                    {link.badge}
                  </span>
                )}
              </Link>
              {link.label === "Video" ? (
                <>
                  <NavbarToolsLink />
                  <NavbarExplorePromptsLink />
                </>
              ) : null}
            </Fragment>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Credits */}
          <div
            className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 sm:flex"
            title="Credits balance"
          >
            <span className="text-xs font-medium text-white/50">Credits</span>
            <span className="text-sm font-bold tabular-nums text-white">{credits}</span>
          </div>

          {/* View Plans */}
          <Link
            href="/pricing"
            className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-black transition-opacity hover:opacity-90"
          >
            View Plans
          </Link>

          {/* Settings dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "flex size-8 items-center justify-center rounded-full border transition-colors",
                open
                  ? "border-[#00e5ff]/50 bg-white/10"
                  : "border-white/15 bg-white/[0.06] hover:border-white/30"
              )}
              aria-label="Settings"
              title={userEmail ?? "Account"}
              aria-haspopup="true"
              aria-expanded={open}
            >
              <Settings size={16} className="text-white/70" />
            </button>

            {open && (
              <div className="absolute right-0 top-10 w-52 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f0f1a] shadow-xl">
                {dropdownItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    <item.icon size={15} className="text-white/40" />
                    {item.label}
                  </Link>
                ))}

                {/* Divider */}
                <div className="border-t border-white/[0.08]" />

                {/* Sign out */}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSignOut?.();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <LogOut size={15} className="text-white/40" />
                  Sign out
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile nav */}
      <nav
        className="flex gap-2 overflow-x-auto border-t border-white/[0.06] bg-[#080810]/95 px-4 py-2 md:hidden"
        aria-label="Dashboard shortcuts"
      >
        {navLinks.map((link) => (
          <Fragment key={link.href + link.label}>
            <Link
              href={link.href}
              className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white/50 transition-colors hover:text-white"
            >
              {link.label}
              {link.badge && (
                <span className="rounded-full bg-[#00e5ff] px-1.5 py-0.5 text-[10px] font-extrabold text-black leading-none">
                  {link.badge}
                </span>
              )}
            </Link>
            {link.label === "Video" ? (
              <span className="flex shrink-0 items-center gap-1">
                <NavbarToolsLink />
                <NavbarExplorePromptsLink />
              </span>
            ) : null}
          </Fragment>
        ))}
      </nav>
    </header>
  );
}

export function DashboardNavbarMobileLinks({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        "flex gap-2 overflow-x-auto border-b border-white/[0.06] bg-[#080810]/95 px-4 py-2 md:hidden",
        className
      )}
      aria-label="Dashboard shortcuts"
    >
      {navLinks.map((link) => (
        <Fragment key={link.href + link.label}>
          <Link
            href={link.href}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white/50 transition-colors hover:text-white"
          >
            {link.label}
          </Link>
          {link.label === "Video" ? (
            <span className="flex shrink-0 items-center gap-1">
              <NavbarToolsLink />
              <NavbarExplorePromptsLink />
            </span>
          ) : null}
        </Fragment>
      ))}
    </nav>
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
  const scheduleNavigation = useScheduledAppRouterNavigation();
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

      let balance = 0;
      let profileName: string | null = null;

      const res = await fetch("/api/credits", { credentials: "include" });
      if (res.ok) {
        const body = (await res.json()) as { credits_balance?: number };
        balance = body.credits_balance ?? 0;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users_profiles")
        .select("credits_balance, full_name")
        .eq("id", user.id)
        .single();

      if (!profileError && profile) {
        if (!res.ok) balance = profile.credits_balance ?? 0;
        profileName = profile.full_name ?? null;
      }

      if (cancelled) return;

      setCredits(balance);
      setDisplayName(
        profileName ??
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
    scheduleNavigation("/");
  }, [scheduleNavigation]);

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
