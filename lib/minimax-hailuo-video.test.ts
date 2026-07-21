import { describe, expect, it } from "vitest";

import {
  buildMinimaxHailuoVideoBody,
  diagnoseMinimaxHailuoRouting,
  resolveMinimaxHailuoDurationAndResolution,
  shouldUseMinimaxForHailuo
} from "@/lib/minimax-hailuo-video";
import { minimaxHailuo23UsdForOptions } from "@/lib/minimax-hailuo-pricing";
import {
  decodeMinimaxVideoPredictionId,
  encodeMinimaxVideoPredictionId,
  mapMinimaxVideoStatusToAtlas
} from "@/lib/minimax-video-api";

describe("MiniMax Hailuo routing helpers", () => {
  it("maps duration/resolution matrix", () => {
    expect(resolveMinimaxHailuoDurationAndResolution({ action: "text" })).toEqual({
      duration: 6,
      resolution: "1080P"
    });
    expect(
      resolveMinimaxHailuoDurationAndResolution({ action: "text", durationSec: 5 })
    ).toEqual({ duration: 6, resolution: "1080P" });
    expect(
      resolveMinimaxHailuoDurationAndResolution({ action: "text", durationSec: 10 })
    ).toEqual({ duration: 10, resolution: "768P" });
    expect(
      resolveMinimaxHailuoDurationAndResolution({ action: "image", durationSec: 6 })
    ).toEqual({ duration: 6, resolution: "1080P" });
    expect(
      resolveMinimaxHailuoDurationAndResolution({ action: "image", durationSec: 10 })
    ).toEqual({ duration: 10, resolution: "768P" });
  });

  it("builds T2V and I2V bodies", () => {
    const t2v = buildMinimaxHailuoVideoBody({
      action: "text",
      prompt: "A dancer on a rooftop"
    });
    expect(t2v.model).toBe("MiniMax-Hailuo-2.3");
    expect(t2v.duration).toBe(6);
    expect(t2v.resolution).toBe("1080P");
    expect(t2v.first_frame_image).toBeUndefined();
    expect(t2v.prompt_optimizer).toBe(true);

    const i2v = buildMinimaxHailuoVideoBody({
      action: "image",
      prompt: "Camera slowly pushes in",
      durationSec: 10,
      imageUrl: "https://example.com/frame.png"
    });
    expect(i2v.duration).toBe(10);
    expect(i2v.resolution).toBe("768P");
    expect(i2v.first_frame_image).toBe("https://example.com/frame.png");
    expect(i2v.prompt_optimizer).toBe(false);
  });

  it("encodes prediction ids and maps poll statuses", () => {
    const id = encodeMinimaxVideoPredictionId("task-123");
    expect(id).toBe("minimax-video:task-123");
    expect(decodeMinimaxVideoPredictionId(id)).toBe("task-123");
    expect(decodeMinimaxVideoPredictionId("atlas-abc")).toBeNull();

    expect(mapMinimaxVideoStatusToAtlas("Success")).toBe("succeeded");
    expect(mapMinimaxVideoStatusToAtlas("Fail")).toBe("failed");
    expect(mapMinimaxVideoStatusToAtlas("Processing")).toBe("processing");
  });

  it("diagnoses eligibility for hailuo-2-3 text/image only", () => {
    const diag = diagnoseMinimaxHailuoRouting({
      videoModel: "hailuo-2-3",
      action: "text"
    });
    expect(diag.actionSupportedForMinimax).toBe(true);
    // Eligible only when env key + flag are set — skipReasons covers that in CI.
    expect(shouldUseMinimaxForHailuo("seedance-2")).toBe(false);

    const lipsync = diagnoseMinimaxHailuoRouting({
      videoModel: "hailuo-2-3",
      action: "lipsync"
    });
    expect(lipsync.actionSupportedForMinimax).toBe(false);
  });
});

describe("MiniMax Hailuo pricing", () => {
  it("uses official PAYG clip rates", () => {
    expect(
      minimaxHailuo23UsdForOptions({ routeAction: "text", durationSeconds: 5 })
    ).toBe(0.49);
    expect(
      minimaxHailuo23UsdForOptions({ routeAction: "image", durationSeconds: 6 })
    ).toBe(0.49);
    expect(
      minimaxHailuo23UsdForOptions({ routeAction: "image", durationSeconds: 10 })
    ).toBe(0.56);
  });
});
