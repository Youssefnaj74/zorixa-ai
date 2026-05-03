type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory rate limiter.
 * Note: In serverless / multi-instance deployments, use a shared store (Redis/Upstash).
 */
export function rateLimit({
  key,
  limit,
  windowMs
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket) {
    buckets.set(key, { tokens: limit - 1, updatedAt: now });
    return { ok: true as const, remaining: limit - 1 };
  }

  const elapsed = now - bucket.updatedAt;
  if (elapsed > windowMs) {
    bucket.tokens = limit - 1;
    bucket.updatedAt = now;
    return { ok: true as const, remaining: bucket.tokens };
  }

  if (bucket.tokens <= 0) return { ok: false as const, remaining: 0 };

  bucket.tokens -= 1;
  return { ok: true as const, remaining: bucket.tokens };
}

