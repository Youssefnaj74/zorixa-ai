"use client";

import Link from "next/link";
import { Home } from "lucide-react";

export function DashboardHomeLink() {
  return (
    <Link
      href="/"
      className="ml-1 hidden items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-zorixa-muted transition-colors hover:bg-white/5 hover:text-white sm:inline-flex"
      title="Back to landing page"
    >
      <Home className="size-3.5" aria-hidden />
      Home
    </Link>
  );
}
