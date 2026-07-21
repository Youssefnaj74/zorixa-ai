import { describe, expect, it } from "vitest";

import {
  buildSameOriginVideoPlaybackUrl,
  isAllowedVideoPlaybackHost
} from "@/lib/video-playback-proxy";

describe("video playback host allowlist", () => {
  it("allows MiniMax Hailuo CDN hosts", () => {
    expect(isAllowedVideoPlaybackHost("video-product.cdn.minimax.io")).toBe(true);
    expect(isAllowedVideoPlaybackHost("filecdn.minimax.chat")).toBe(true);
    expect(isAllowedVideoPlaybackHost("cdn.minimax.io")).toBe(true);
  });

  it("still blocks unrelated hosts", () => {
    expect(isAllowedVideoPlaybackHost("evil.example.com")).toBe(false);
    expect(isAllowedVideoPlaybackHost("api.minimax.io")).toBe(false);
  });

  it("proxies MiniMax URLs through same-origin playback", () => {
    const raw =
      "https://video-product.cdn.minimax.io/inference_output/video/2026-07-21/abc/output.mp4";
    const proxied = buildSameOriginVideoPlaybackUrl(raw, "https://www.zorixaai.com");
    expect(proxied.startsWith("https://www.zorixaai.com/api/video-playback?url=")).toBe(true);
    expect(proxied).toContain(encodeURIComponent(raw));
  });
});
