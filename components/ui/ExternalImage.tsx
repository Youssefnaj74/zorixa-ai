"use client";

import { cn } from "@/lib/utils";

export type ExternalImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  onError?: React.ReactEventHandler<HTMLImageElement>;
};

/**
 * Native img for Atlas OSS / Supabase / other CDN URLs.
 * Avoids next/image remotePatterns checks and /_next/image optimizer 400s.
 */
export function ExternalImage({
  src,
  alt,
  width,
  height,
  className,
  style,
  onLoad,
  onError
}: ExternalImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={style}
      className={cn(className)}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={onLoad}
      onError={onError}
    />
  );
}
