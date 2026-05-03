"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

import { NavbarToolsMenu } from "@/components/layout/NavbarToolsMenu";

type NavItem = {
  href: string;
  label: string;
  newBadge?: boolean;
  pill?: boolean;
};

type NavEntry = NavItem | { kind: "tools" };

const NAV_ENTRIES: NavEntry[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard", label: "Apps", newBadge: true },
  { href: "#", label: "Skin" },
  { href: "/image", label: "Image" },
  { href: "/video", label: "Video" },
  { href: "/dashboard/enhance", label: "Upscaler" },
  { href: "#", label: "Kora", pill: true },
  { kind: "tools" },
  { href: "/dashboard/history", label: "Gallery" },
  { href: "#", label: "University", newBadge: true }
];

export function Navbar({
  avatarLetter,
  fixed
}: {
  avatarLetter?: string;
  /** Pin navbar to viewport top (use with main content `pt-14`). */
  fixed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "relative z-40 border-b border-[rgba(131,56,235,0.15)] bg-zorixa-bg/95 backdrop-blur-md",
        fixed ? "fixed inset-x-0 top-0" : "sticky top-0"
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1920px] items-center gap-4 px-4 lg:px-6">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <span className="bg-gradient-brand bg-clip-text font-display text-lg font-bold tracking-tight text-transparent">
            Zorixa AI
          </span>
        </Link>

        <nav className="studio-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:gap-2">
          {NAV_ENTRIES.map((entry) => {
            if ("kind" in entry && entry.kind === "tools") {
              return <NavbarToolsMenu key="nav-tools" />;
            }

            const item = entry as NavItem;
            const active =
              item.href !== "#" &&
              (pathname === item.href || pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  item.pill ? "rounded-full bg-brand/20 px-3 text-brand-light ring-1 ring-brand/30" : null,
                  !item.pill && active && "text-white",
                  !item.pill && !active && "text-zorixa-muted hover:text-white"
                )}
              >
                {item.label}
                {item.newBadge ? <Badge variant="newTeal">NEW</Badge> : null}
                {!item.pill && active ? (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-zorixa-tab to-brand"
                    aria-hidden
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-white/10 text-zorixa-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Search"
          >
            <Search className="size-4" />
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-brand/40 bg-gradient-brand/25 font-display text-sm font-bold text-white ring-1 ring-brand/50"
            aria-label="Account"
          >
            {avatarLetter ? (
              <span>{avatarLetter.slice(0, 1).toUpperCase()}</span>
            ) : (
              <span className="text-xs">?</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
