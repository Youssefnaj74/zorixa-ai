"use client";

import { DashboardMobileNav } from "@/components/dashboard/mobile-nav";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { usePathname } from "next/navigation";

/**
 * Shared chrome for /dashboard routes that use the editor sidebar (Enhancor-style canvas #030005).
 */
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullBleed = pathname === "/dashboard/history";

  return (
    <div className="flex min-h-dvh bg-studio-canvas">
      {fullBleed ? null : (
        <div className="hidden md:block">
          <DashboardSidebar />
        </div>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {fullBleed ? null : <DashboardMobileNav />}
        {children}
      </div>
    </div>
  );
}
