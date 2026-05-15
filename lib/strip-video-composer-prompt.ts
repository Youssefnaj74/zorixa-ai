const PRODUCT_IMAGE_TOKEN = /@PRODUCT_IMAGE\d+\b/gi;

/**
 * Removes composer-only @PRODUCT_IMAGE… tokens before sending prompts to Atlas.
 * UI may keep the full text for the user; API payloads should use this.
 */
export function stripVideoComposerAssetTokens(prompt: string): string {
  return prompt.replace(PRODUCT_IMAGE_TOKEN, " ").replace(/\s{2,}/g, " ").trim();
}
