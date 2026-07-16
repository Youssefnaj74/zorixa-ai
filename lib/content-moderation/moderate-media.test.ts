import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { moderateMediaUrl } from "./moderate-media";

describe("moderateMediaUrl", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.ATLASCLOUD_API_KEY = "test-key";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("blocks when classifier returns NUDITY", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "NUDITY" } }]
      })
    }) as unknown as typeof fetch;

    const result = await moderateMediaUrl("https://example.com/n.png", "image");
    expect(result.blocked).toBe(true);
    if (result.blocked && !("error" in result && result.error)) {
      expect(result.category).toBe("nudity");
      expect(result.label).toBe("NUDITY");
    }
  });

  it("allows when classifier returns SAFE", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "SAFE" } }]
      })
    }) as unknown as typeof fetch;

    const result = await moderateMediaUrl("https://example.com/ok.png", "image");
    expect(result.blocked).toBe(false);
  });

  it("fail-closes on classifier HTTP errors", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ msg: "boom" })
    }) as unknown as typeof fetch;

    const result = await moderateMediaUrl("https://example.com/x.png", "image");
    expect(result.blocked).toBe(true);
    if (result.blocked) {
      expect("error" in result && result.error).toBe(true);
    }
  });
});
