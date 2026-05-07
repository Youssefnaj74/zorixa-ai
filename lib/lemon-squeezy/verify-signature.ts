import crypto from "node:crypto";

/**
 * Verify `X-Signature` HMAC from Lemon Squeezy webhooks.
 * @see https://docs.lemonsqueezy.com/help/webhooks/signing-requests
 */
export function verifyLemonSqueezySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signatureHeader, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
