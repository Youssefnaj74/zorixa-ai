import { Navbar } from "@/components/layout/Navbar";
import { ToolsCatalogView } from "@/components/tools/ToolsCatalogView";
import { siteCanonical } from "@/lib/site-metadata";

export const metadata = {
  title: "Tools — Zorixa AI",
  ...siteCanonical("/tools")
};

const NAV_H = 56;

export default function ToolsPage() {
  return (
    <div className="min-h-dvh bg-zorixa-bg font-body">
      <Navbar />
      <main className="min-h-[calc(100dvh-56px)]" style={{ paddingTop: NAV_H }}>
        <ToolsCatalogView />
      </main>
    </div>
  );
}
