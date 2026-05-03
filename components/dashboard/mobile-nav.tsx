"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, History, Image, LayoutGrid, Palette, Video } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/image", label: "Create", icon: Palette },
  { href: "/dashboard/enhance", label: "Enhance", icon: Image },
  { href: "/video", label: "Video", icon: Video },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard }
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-40 flex gap-1 overflow-x-auto border-b border-white/10 bg-zinc-950/95 px-3 py-2 backdrop-blur md:hidden"
      aria-label="Dashboard"
    >
      {items.map((item) => {
        const active = isNavActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
              active
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="size-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
