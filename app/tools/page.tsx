import { Navbar } from "@/components/layout/Navbar";
import { ToolsCatalogView } from "@/components/tools/ToolsCatalogView";
import { siteCanonical } from "@/lib/site-metadata";

export const metadata = {
  title: "Tools — Zorixa AI",
  ...siteCanonical("/tools")
};

import { NAV_H } from "@/lib/nav-chrome";

export default function ToolsPage() {
  return (
    <div className="min-h-dvh bg-zorixa-bg font-body">
      <Navbar />
      <main className="min-h-dvh" style={{ paddingTop: NAV_H, minHeight: `calc(100dvh - ${NAV_H}px)` }}>
        <ToolsCatalogView />
      </main>
    </div>
  );
}
