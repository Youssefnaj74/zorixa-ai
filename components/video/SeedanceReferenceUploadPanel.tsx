"use client";

import { ReferenceAtlasColumnUpload } from "@/components/video/ReferenceAtlasColumnUpload";
import {
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_AUDIOS,
  SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS,
  referenceToVideoMaxImages
} from "@/components/video/bottom-bar-models";
import { cn } from "@/lib/utils";

type SeedanceReferenceUploadPanelProps = {
  composerModelId: string;
  referenceImageUrls: (string | null)[];
  referenceVideoUrls: (string | null)[];
  referenceAudioUrls: (string | null)[];
  onReferenceImageChange?: (index: number, url: string | null) => void;
  onReferenceVideoChange?: (index: number, url: string | null) => void;
  onReferenceAudioChange?: (index: number, url: string | null) => void;
  className?: string;
};

/** Seedance 2.0 R2V — Atlas-style 3-column reference row (images · videos · audios). */
export function SeedanceReferenceUploadPanel({
  composerModelId,
  referenceImageUrls,
  referenceVideoUrls,
  referenceAudioUrls,
  onReferenceImageChange,
  onReferenceVideoChange,
  onReferenceAudioChange,
  className
}: SeedanceReferenceUploadPanelProps) {
  const maxImages = referenceToVideoMaxImages(composerModelId);

  return (
    <div
      className={cn(
        "grid min-w-0 flex-1 grid-cols-3 gap-2 sm:gap-2.5",
        "max-lg:flex max-lg:w-full max-lg:snap-x max-lg:snap-mandatory max-lg:grid-cols-none max-lg:gap-2 max-lg:overflow-x-auto max-lg:scrollbar-hide",
        className
      )}
    >
        <ReferenceAtlasColumnUpload
          kind="image"
          title="Reference images"
          hint="Character, style, background · jpeg/png/webp"
          urls={referenceImageUrls}
          maxSlots={maxImages}
          accept="image/*"
          onChange={onReferenceImageChange}
          className="max-lg:min-w-[min(76vw,260px)] max-lg:snap-start max-lg:shrink-0"
        />
        <ReferenceAtlasColumnUpload
          kind="video"
          title="Reference videos"
          hint="Motion, camera, pacing · mp4/mov"
          urls={referenceVideoUrls}
          maxSlots={SEEDANCE_REFERENCE_TO_VIDEO_MAX_VIDEOS}
          accept="video/mp4,video/quicktime,video/*"
          onChange={onReferenceVideoChange}
          className="max-lg:min-w-[min(76vw,260px)] max-lg:snap-start max-lg:shrink-0"
        />
        <ReferenceAtlasColumnUpload
          kind="audio"
          title="Reference audios"
          hint="Rhythm, mood, soundtrack · mp3/wav"
          urls={referenceAudioUrls}
          maxSlots={SEEDANCE_REFERENCE_TO_VIDEO_MAX_AUDIOS}
          accept="audio/mpeg,audio/wav,audio/*"
          onChange={onReferenceAudioChange}
          className="max-lg:min-w-[min(76vw,260px)] max-lg:snap-start max-lg:shrink-0"
        />
    </div>
  );
}
