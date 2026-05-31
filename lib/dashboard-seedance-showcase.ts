import showcaseData from "@/data/dashboard-seedance-showcase.json";
import { buildCatalogStudioHref } from "@/lib/studio-catalog-link";

export type DashboardSeedanceClip = {
  id: string;
  prompt: string;
  src: string;
  href?: string;
};

export type DashboardSeedanceShowcase = {
  title: string;
  subtitle?: string;
  aspectRatio: string;
  clips: DashboardSeedanceClip[];
};

export const DASHBOARD_SEEDANCE_SHOWCASE = showcaseData as DashboardSeedanceShowcase;

export const SEEDANCE_SHOWCASE_STUDIO_HREF = buildCatalogStudioHref("text-to-video", "seedance-2", {
  toolName: "Seedance 2.0 Text to Video"
});
