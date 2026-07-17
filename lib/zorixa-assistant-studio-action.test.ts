import { describe, expect, it } from "vitest";

import {
  buildStudioDeepLink,
  extractStudioAction
} from "@/lib/zorixa-assistant-studio-action";

describe("extractStudioAction", () => {
  it("parses zorixa-studio fences and strips them from display text", () => {
    const reply = `Recommended Model: Seedance 2.0

Duration: 5s

Prompt:
A cinematic perfume commercial...

\`\`\`zorixa-studio
{"type":"video","modelId":"seedance-2","durationSeconds":5,"tab":"Text to Video","prompt":"A cinematic perfume commercial on marble"}
\`\`\`
`;
    const parsed = extractStudioAction(reply);
    expect(parsed.displayText).toContain("Seedance 2.0");
    expect(parsed.displayText).not.toContain("zorixa-studio");
    expect(parsed.action).toMatchObject({
      type: "video",
      modelId: "seedance-2",
      durationSeconds: 5,
      tab: "Text to Video",
      prompt: "A cinematic perfume commercial on marble"
    });
    expect(buildStudioDeepLink(parsed.action!)).toContain("/video?");
    expect(buildStudioDeepLink(parsed.action!)).toContain("model=seedance-2");
    expect(buildStudioDeepLink(parsed.action!)).toContain("duration=5");
  });
});
