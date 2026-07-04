import { Suspense } from "react";

import { ImageGenerationPage } from "@/components/image/ImageGenerationPage";
import { siteCanonical } from "@/lib/site-metadata";

export const metadata = {
  title: "Image generation",
  ...siteCanonical("/image")
};

export default function ImagePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-zorixa-bg" />}>
      <ImageGenerationPage />
    </Suspense>
  );
}
