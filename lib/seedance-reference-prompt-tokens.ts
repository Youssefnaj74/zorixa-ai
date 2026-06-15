export type SeedanceReferenceMediaKind = "image" | "video" | "audio";

/** Atlas Seedance R2V prompt placeholder, e.g. `@image1`, `@video2`, `@audio3`. */
export function seedanceReferencePromptToken(
  kind: SeedanceReferenceMediaKind,
  slotIndex: number
): string {
  return `@${kind}${slotIndex + 1}`;
}

const tokenPattern = (kind: SeedanceReferenceMediaKind, slotIndex: number) =>
  new RegExp(`@${kind}${slotIndex + 1}\\b`, "i");

export function promptContainsSeedanceReferenceToken(
  prompt: string,
  kind: SeedanceReferenceMediaKind,
  slotIndex: number
): boolean {
  return tokenPattern(kind, slotIndex).test(prompt);
}

export function appendSeedanceReferenceTokenToPrompt(
  prompt: string,
  kind: SeedanceReferenceMediaKind,
  slotIndex: number
): string {
  const token = seedanceReferencePromptToken(kind, slotIndex);
  if (promptContainsSeedanceReferenceToken(prompt, kind, slotIndex)) return prompt;
  const trimmed = prompt.trimEnd();
  return trimmed ? `${trimmed} ${token}` : token;
}

export function removeSeedanceReferenceTokenFromPrompt(
  prompt: string,
  kind: SeedanceReferenceMediaKind,
  slotIndex: number
): string {
  const token = seedanceReferencePromptToken(kind, slotIndex);
  return prompt
    .replace(new RegExp(`\\s*${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Ensures `@imageN` / `@videoN` / `@audioN` exist for every uploaded ref slot. */
export function ensureSeedanceReferenceTokensInPrompt(
  prompt: string,
  refs: { imageCount: number; videoCount: number; audioCount: number }
): string {
  let out = prompt;
  for (let i = 0; i < refs.imageCount; i++) {
    out = appendSeedanceReferenceTokenToPrompt(out, "image", i);
  }
  for (let i = 0; i < refs.videoCount; i++) {
    out = appendSeedanceReferenceTokenToPrompt(out, "video", i);
  }
  for (let i = 0; i < refs.audioCount; i++) {
    out = appendSeedanceReferenceTokenToPrompt(out, "audio", i);
  }
  return out;
}
