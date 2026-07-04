import { Suspense } from "react";

import { PricingView } from "@/components/pricing/PricingView";
import { siteCanonical } from "@/lib/site-metadata";

export const metadata = {
  title: "Pricing",
  description: "Zorixa AI credit packs and per-model credit rates for image, video, and speech.",
  ...siteCanonical("/pricing")
};

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingView />
    </Suspense>
  );
}
