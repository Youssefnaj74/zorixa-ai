"use client";

import { ReferenceAtlasColumnUpload } from "@/components/video/ReferenceAtlasColumnUpload";
import {
  WAN_27_REFERENCE_MAX_IMAGES,
  WAN_27_REFERENCE_MAX_MATERIALS,
  WAN_27_REFERENCE_MAX_VIDEOS,
  WAN_27_REFERENCE_MAX_VOICE_AUDIOS
} from "@/lib/atlas-wan-27-video";
import { cn } from "@/lib/utils";

type WanReferenceUploadPanelProps = {
  referenceImageUrls: (string | null)[];
  referenceVideoUrls: (string | null)[];
  referenceVoiceUrls: (string | null)[];
  onReferenceImageChange?: (index: number, url: string | null) => void;
  onReferenceVideoChange?: (index: number, url: string | null) => void;
  onReferenceVoiceChange?: (index: number, url: string | null) => void;
  className?: string;
};

/** Wan 2.7 R2V — images · videos · voice (max 5 materials combined). */
export function WanReferenceUploadPanel({
  referenceImageUrls,
  referenceVideoUrls,
  referenceVoiceUrls,
  onReferenceImageChange,
  onReferenceVideoChange,
  onReferenceVoiceChange,
  className
}: WanReferenceUploadPanelProps) {
  return (
    <div className={cn("grid min-w-0 flex-1 grid-cols-3 gap-2 max-lg:grid-cols-1 sm:gap-2.5", className)}>
      <ReferenceAtlasColumnUpload
        kind="image"
        title="Reference images"
        hint={`Up to ${WAN_27_REFERENCE_MAX_IMAGES} · character1…`}
        urls={referenceImageUrls}
        maxSlots={WAN_27_REFERENCE_MAX_IMAGES}
        accept="image/*"
        onChange={onReferenceImageChange}
      />
      <ReferenceAtlasColumnUpload
        kind="video"
        title="Reference videos"
        hint={`Up to ${WAN_27_REFERENCE_MAX_VIDEOS} · mp4/mov`}
        urls={referenceVideoUrls}
        maxSlots={WAN_27_REFERENCE_MAX_VIDEOS}
        accept="video/mp4,video/quicktime,video/*"
        onChange={onReferenceVideoChange}
      />
      <ReferenceAtlasColumnUpload
        kind="audio"
        title="Voice reference"
        hint="Voice clone · wav/mp3 · 1–10s"
        urls={referenceVoiceUrls}
        maxSlots={WAN_27_REFERENCE_MAX_VOICE_AUDIOS}
        accept="audio/mpeg,audio/wav,audio/*"
        onChange={onReferenceVoiceChange}
      />
      <p className="col-span-3 text-[10px] leading-snug text-zorixa-muted/90">
        Max {WAN_27_REFERENCE_MAX_MATERIALS} image + video refs combined. Use{" "}
        <span className="font-medium text-white/85">character1</span>,{" "}
        <span className="font-medium text-white/85">character2</span> in your prompt.
      </p>
    </div>
  );
}
