import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ExplorePromptsView } from "@/components/explore-prompts/ExplorePromptsView";
import { Navbar } from "@/components/layout/Navbar";
import { EXPLORE_PROMPTS_PUBLIC } from "@/lib/site-features";
import { siteCanonical } from "@/lib/site-metadata";

export const metadata = {
  title: "Explore prompts — Zorixa AI",
  ...siteCanonical("/explore-prompts")
};

import { NAV_H } from "@/lib/nav-chrome";

export default function ExplorePromptsPage() {
  if (!EXPLORE_PROMPTS_PUBLIC) {
    redirect("/image");
  }

  return (
    <div className="min-h-dvh bg-black font-body">
      <Navbar />
      <main
        className="min-h-dvh bg-black"
        style={{ paddingTop: NAV_H, minHeight: `calc(100dvh - ${NAV_H}px)` }}
      >
        <Suspense fallback={<div className="min-h-[40vh]" />}>
          <ExplorePromptsView />
        </Suspense>
      </main>
    </div>
  );
}
