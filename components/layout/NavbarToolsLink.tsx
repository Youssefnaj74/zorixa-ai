"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/** Nav item — opens full Tools gallery at /tools. */
export function NavbarToolsLink() {
  const pathname = usePathname();
  const active = pathname === "/tools" || pathname.startsWith("/tools/");

  return (
    <Link
      href="/tools"
      className={cn(
        "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
        active ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
      )}
    >
      <span>Tools</span>
      <span className="inline-block size-2 shrink-0 rounded-full bg-[#ef4444]" aria-hidden />
    </Link>
  );
}
