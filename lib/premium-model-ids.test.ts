import { describe, expect, it } from "vitest";

import { isPremiumImageModel, isPremiumVideoModel } from "@/lib/premium-model-ids";

describe("premium model gates", () => {
  it("locks expensive video composers", () => {
    expect(isPremiumVideoModel("kling-3-pro")).toBe(true);
    expect(isPremiumVideoModel("google-veo-3-1")).toBe(true);
    expect(isPremiumVideoModel("seedance-2")).toBe(true);
    expect(isPremiumVideoModel("wan-2-7")).toBe(false);
  });

  it("locks expensive image composers", () => {
    expect(isPremiumImageModel("seedream-5-pro")).toBe(true);
    expect(isPremiumImageModel("flux-schnell")).toBe(false);
  });
});
