import { Suspense } from "react";

import { TextToSpeechPage } from "@/components/audio/TextToSpeechPage";
import { siteCanonical } from "@/lib/site-metadata";

export const metadata = {
  title: "Text to Speech",
  ...siteCanonical("/audio")
};

export default function AudioPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-zorixa-bg" />}>
      <TextToSpeechPage />
    </Suspense>
  );
}
