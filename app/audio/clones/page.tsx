import { Suspense } from "react";

import { VoiceCloneStudioPage } from "@/components/audio/VoiceCloneStudioPage";
import { siteCanonical } from "@/lib/site-metadata";

export const metadata = {
  title: "Voice Clone",
  ...siteCanonical("/audio/clones")
};

export default function VoiceClonePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-zorixa-bg" />}>
      <VoiceCloneStudioPage />
    </Suspense>
  );
}
