import { Navbar } from "@/components/layout/Navbar";
import { ToolsCatalogView } from "@/components/tools/ToolsCatalogView";

export const metadata = {
  title: "Tools — Zorixa AI"
};

const NAV_H = 56;

export default function ToolsPage() {
  return (
    <div className="min-h-dvh bg-zorixa-bg font-body">
      <Navbar />
      <main className="zorixa-grid-bg min-h-[calc(100dvh-56px)]" style={{ paddingTop: NAV_H }}>
        <ToolsCatalogView />
      </main>
    </div>
  );
}
