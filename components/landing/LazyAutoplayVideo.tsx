"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type LazyAutoplayVideoProps = {
  src: string;
  poster: string;
  posterAlt: string;
  ariaLabel: string;
  className?: string;
};

export function LazyAutoplayVideo({
  src,
  poster,
  posterAlt,
  ariaLabel,
  className = "absolute inset-0 size-full object-cover"
}: LazyAutoplayVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    const video = videoRef.current;
    if (!video) return;

    video.src = src;
    video.load();
    void video.play().catch(() => {
      /* autoplay may be blocked until user gesture */
    });
  }, [shouldLoad, src]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {shouldLoad ? (
        <video
          ref={videoRef}
          poster={poster}
          className={className}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-label={ariaLabel}
        />
      ) : (
        <Image src={poster} alt={posterAlt} fill sizes="(max-width: 640px) 50vw, 25vw" className={className} loading="lazy" />
      )}
    </div>
  );
}
