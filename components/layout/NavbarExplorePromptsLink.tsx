"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function NavbarExplorePromptsLink() {
  const pathname = usePathname();
  const active = pathname === "/explore-prompts" || pathname.startsWith("/explore-prompts/");

  return (
    <Link
      href="/explore-prompts"
      className={cn(
        "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
        active ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
      )}
    >
      Explore prompts
    </Link>
  );
}
