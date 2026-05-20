import { Suspense } from "react";

import { VideoGenerationPage } from "@/components/video/VideoGenerationPage";

export const metadata = {
  title: "Video generation"
};

export default function VideoPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-zorixa-bg" />}>
      <VideoGenerationPage />
    </Suspense>
  );
}
