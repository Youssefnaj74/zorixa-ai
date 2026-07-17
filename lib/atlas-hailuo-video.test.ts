import { describe, expect, it } from "vitest";

import {
  buildHailuo23AtlasBody,
  HAILUO_23_I2V_STANDARD_ATLAS,
  HAILUO_23_T2V_PRO_ATLAS,
  isHailuo23I2vImageMagic,
  resolveHailuo23EnablePromptExpansion
} from "@/lib/atlas-hailuo-video";
import { rewriteShowcaseAssetUrlForAtlas } from "@/lib/upload-client-media";

describe("Hailuo 2.3 Atlas body", () => {
  it("defaults prompt expansion off for I2V and on for T2V", () => {
    expect(resolveHailuo23EnablePromptExpansion(HAILUO_23_I2V_STANDARD_ATLAS)).toBe(false);
    expect(resolveHailuo23EnablePromptExpansion(HAILUO_23_T2V_PRO_ATLAS)).toBe(true);
    expect(resolveHailuo23EnablePromptExpansion(HAILUO_23_I2V_STANDARD_ATLAS, true)).toBe(true);
  });

  it("builds I2V body with image + duration and expansion off by default", () => {
    const body = buildHailuo23AtlasBody({
      model: HAILUO_23_I2V_STANDARD_ATLAS,
      prompt: "smile naturally",
      durationSec: 6,
      imageUrl: "https://www.zorixaai.com/video-showcases/i2v/hailuo-2-3-start.png"
    });
    expect(body).toEqual({
      model: HAILUO_23_I2V_STANDARD_ATLAS,
      prompt: "smile naturally",
      enable_prompt_expansion: false,
      duration: 6,
      image: "https://www.zorixaai.com/video-showcases/i2v/hailuo-2-3-start.png"
    });
  });

  it("rewrites localhost showcase paths to production for Atlas", () => {
    expect(rewriteShowcaseAssetUrlForAtlas("/video-showcases/i2v/hailuo-2-3-start.png")).toBe(
      "https://www.zorixaai.com/video-showcases/i2v/hailuo-2-3-start.png"
    );
    expect(
      rewriteShowcaseAssetUrlForAtlas(
        "http://localhost:3000/video-showcases/i2v/hailuo-2-3-start.png"
      )
    ).toBe("https://www.zorixaai.com/video-showcases/i2v/hailuo-2-3-start.png");
  });

  it("detects PNG/JPEG/WebP magic and rejects AVIF", () => {
    expect(isHailuo23I2vImageMagic(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(
      true
    );
    expect(isHailuo23I2vImageMagic(Uint8Array.from([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(
      true
    );
    expect(
      isHailuo23I2vImageMagic(
        Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])
      )
    ).toBe(true);
    // AVIF ftyp
    expect(
      isHailuo23I2vImageMagic(
        Uint8Array.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66])
      )
    ).toBe(false);
  });
});
