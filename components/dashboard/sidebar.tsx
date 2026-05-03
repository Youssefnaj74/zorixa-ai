"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, History, Image, LayoutGrid, LogOut, Palette, Sparkles, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCredits } from "@/lib/hooks/use-credits";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
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

export function DashboardSidebar() {
  const pathname = usePathname();
  const { credits, isLoading } = useCredits();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <aside className="flex h-dvh w-64 flex-col border-r border-white/10 bg-zinc-950 px-4 py-5">
      <Link href="/" className="flex items-center gap-2 px-2 text-sm font-semibold">
        <span className="grid size-8 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10">
          <Sparkles className="size-4 text-violet-300" />
        </span>
        <span>Zorixa AI</span>
      </Link>

      <nav className="mt-6 space-y-1">
        {nav.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white",
                active && "bg-white/5 text-white"
              )}
            >
              <Icon className="size-4 text-violet-300" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
        <div className="text-xs font-medium text-zinc-400">Credits</div>
        <div className="mt-1 text-lg font-semibold text-white">
          {isLoading ? "…" : credits}
        </div>
      </div>

      <div className="mt-auto space-y-3 px-2">
        <Button
          variant="ghost"
          className="w-full justify-start bg-white/5 text-zinc-200 hover:bg-white/10"
          onClick={signOut}
        >
          <LogOut className="mr-2 size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

