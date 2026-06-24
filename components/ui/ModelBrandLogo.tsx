"use client";

import { Sparkles } from "lucide-react";
import { useCallback, useState } from "react";

import {
  MODEL_LOGO_DEFAULT_SIZE,
  modelLogoImgClassName,
  resolveModelLogoPath
} from "@/lib/model-logos";
import { modelLogoAlt } from "@/lib/image-alt-text";
import { cn } from "@/lib/utils";

function FallbackLogo({ size }: { size: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-md bg-[#8338eb]/20 text-[#c084fc]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Sparkles style={{ width: size * 0.55, height: size * 0.55 }} />
    </span>
  );
}

export function ModelBrandLogo({
  composerId,
  className,
  size = MODEL_LOGO_DEFAULT_SIZE
}: {
  composerId: string;
  className?: string;
  size?: number;
}) {
  const src = resolveModelLogoPath(composerId);
  const [failed, setFailed] = useState(false);

  const onError = useCallback(() => setFailed(true), []);

  if (!src || failed) {
    return (
      <span className={cn("inline-flex shrink-0", className)}>
        <FallbackLogo size={size} />
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden", className)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- official brand assets (svg/ico) from /public */}
      <img
        src={src}
        alt={modelLogoAlt(composerId)}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={onError}
        className={cn(
          "size-full object-contain",
          modelLogoImgClassName(src)
        )}
      />
    </span>
  );
}
