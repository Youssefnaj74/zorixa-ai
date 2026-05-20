import { Suspense } from "react";

import { ImageGenerationPage } from "@/components/image/ImageGenerationPage";

export const metadata = {
  title: "Image generation"
};

export default function ImagePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-zorixa-bg" />}>
      <ImageGenerationPage />
    </Suspense>
  );
}
