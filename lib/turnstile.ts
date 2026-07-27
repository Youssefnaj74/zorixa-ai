/**
 * Cloudflare Turnstile server verification.
 * When TURNSTILE_SECRET_KEY is unset, verification is skipped (local/dev).
 */

export function turnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
}

export function turnstileSecretKey(): string | null {
  return process.env.TURNSTILE_SECRET_KEY?.trim() || null;
}

export function isTurnstileConfigured(): boolean {
  return Boolean(turnstileSiteKey() && turnstileSecretKey());
}

export async function verifyTurnstileToken(args: {
  token: string | null | undefined;
  ip?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = turnstileSecretKey();
  if (!secret) {
    // Not configured — allow (dev / before Turnstile rollout).
    return { ok: true };
  }

  const token = args.token?.trim();
  if (!token) {
    return { ok: false, error: "Complete the human verification challenge." };
  }

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (args.ip) body.set("remoteip", args.ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store"
    });

    const json = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!json.success) {
      console.warn("[turnstile] verification failed", json["error-codes"]);
      return { ok: false, error: "Human verification failed. Please try again." };
    }
    return { ok: true };
  } catch (err) {
    console.error("[turnstile] verify error", err);
    return { ok: false, error: "Human verification unavailable. Please try again." };
  }
}
