"use client";

import { cn } from "@/lib/utils";

type ExternalImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
};

/**
 * Native img for Atlas OSS / Supabase / other CDN URLs.
 * Avoids next/image remotePatterns checks and /_next/image optimizer 400s.
 */
export function ExternalImage({ src, alt, width, height, className }: ExternalImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn(className)}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}
