import { Suspense } from "react";

import { ExplorePromptsView } from "@/components/explore-prompts/ExplorePromptsView";
import { Navbar } from "@/components/layout/Navbar";

export const metadata = {
  title: "Explore prompts — Zorixa AI"
};

const NAV_H = 56;

export default function ExplorePromptsPage() {
  return (
    <div className="min-h-dvh bg-black font-body">
      <Navbar />
      <main className="min-h-[calc(100dvh-56px)] bg-black" style={{ paddingTop: NAV_H }}>
        <Suspense fallback={<div className="min-h-[40vh]" />}>
          <ExplorePromptsView />
        </Suspense>
      </main>
    </div>
  );
}
