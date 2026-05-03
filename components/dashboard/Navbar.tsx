import Link from "next/link";

import { cn } from "@/lib/utils";

export type DashboardNavbarProps = {
  credits: number;
  userEmail: string | null;
  displayName: string | null;
  avatarUrl: string | null;
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

export function DashboardNavbar({ credits, userEmail, displayName, avatarUrl }: DashboardNavbarProps) {
  const initial = avatarInitial(displayName, userEmail);

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
            Subscribe
          </Link>

          <div
            className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-surface-border bg-surface-elevated font-heading text-sm font-semibold text-white"
            title={userEmail ?? "Account"}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Supabase avatar URL
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <span aria-hidden>{initial}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/** Mobile-only duplicate nav row under fixed bar when needed — optional strip */
export function DashboardNavbarMobileLinks({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        "flex gap-2 overflow-x-auto border-b border-surface-border bg-surface-bg/95 px-4 py-2 md:hidden",
        className
      )}
      aria-label="Dashboard shortcuts"
    >
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="font-heading shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white/60 hover:text-white"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
