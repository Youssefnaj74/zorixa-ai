import { NextResponse } from "next/server";

type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

function memoryRateLimit(key: string, limit: number, windowMs: number) {
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

function upstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

/**
 * Distributed fixed-window counter via Upstash Redis REST.
 * Falls back to in-memory when env is unset (local / single instance).
 */
async function upstashRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: true; remaining: number } | { ok: false; remaining: 0 } | null> {
  const cfg = upstashConfig();
  if (!cfg) return null;

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const redisKey = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;

  try {
    const res = await fetch(`${cfg.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSec]
      ]),
      cache: "no-store"
    });

    if (!res.ok) {
      console.warn("[rate-limit] Upstash pipeline failed", res.status);
      return null;
    }

    const data = (await res.json()) as Array<{ result?: number } | number>;
    const incrRaw = data[0];
    const count =
      typeof incrRaw === "number"
        ? incrRaw
        : typeof incrRaw?.result === "number"
          ? incrRaw.result
          : NaN;

    if (!Number.isFinite(count)) return null;

    if (count > limit) {
      return { ok: false, remaining: 0 };
    }
    return { ok: true, remaining: Math.max(0, limit - count) };
  } catch (err) {
    console.warn("[rate-limit] Upstash error — falling back to memory", err);
    return null;
  }
}

/**
 * Simple in-memory rate limiter (sync). Prefer `rateLimitAsync` on paid generation routes.
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
  return memoryRateLimit(key, limit, windowMs);
}

/** Upstash when configured, otherwise in-memory. */
export async function rateLimitAsync({
  key,
  limit,
  windowMs
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const distributed = await upstashRateLimit(key, limit, windowMs);
  if (distributed) return distributed;
  return memoryRateLimit(key, limit, windowMs);
}

export async function rateLimitResponse(args: {
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
}): Promise<NextResponse | null> {
  const rl = await rateLimitAsync(args);
  if (rl.ok) return null;
  const retryAfterSec = Math.max(1, Math.ceil(args.windowMs / 1000));
  return NextResponse.json(
    {
      error: args.message ?? "Too many requests. Please try again shortly."
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(args.limit),
        "X-RateLimit-Remaining": "0"
      }
    }
  );
}
