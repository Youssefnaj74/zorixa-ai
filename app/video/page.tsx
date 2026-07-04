import { Suspense } from "react";

import { VideoGenerationPage } from "@/components/video/VideoGenerationPage";
import { siteCanonical } from "@/lib/site-metadata";

export const metadata = {
  title: "Video generation",
  ...siteCanonical("/video")
};

export default function VideoPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-zorixa-bg" />}>
      <VideoGenerationPage />
    </Suspense>
  );
}
