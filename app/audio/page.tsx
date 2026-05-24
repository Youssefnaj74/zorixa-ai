import { Suspense } from "react";

import { TextToSpeechPage } from "@/components/audio/TextToSpeechPage";

export const metadata = {
  title: "Text to Speech"
};

export default function AudioPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-zorixa-bg" />}>
      <TextToSpeechPage />
    </Suspense>
  );
}
