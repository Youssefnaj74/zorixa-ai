/**
 * Lightweight error reporting. Uses Sentry store API when SENTRY_DSN is set;
 * always logs to console. No @sentry/nextjs dependency required.
 */

type ReportContext = Record<string, unknown>;

function parseSentryDsn(dsn: string): {
  publicKey: string;
  host: string;
  projectId: string;
} | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\//, "").split("/")[0];
    if (!publicKey || !projectId || !url.host) return null;
    return { publicKey, host: url.host, projectId };
  } catch {
    return null;
  }
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" ? error : "Unknown error");
}

export async function reportError(
  error: unknown,
  context: ReportContext = {}
): Promise<void> {
  const err = toError(error);
  console.error("[reportError]", err.message, context);

  const dsn =
    process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || "";
  if (!dsn) return;

  const parsed = parseSentryDsn(dsn);
  if (!parsed) {
    console.warn("[reportError] Invalid SENTRY_DSN");
    return;
  }

  const event = {
    event_id: crypto.randomUUID().replace(/-/g, ""),
    timestamp: Date.now() / 1000,
    platform: "node",
    level: "error",
    server_name: process.env.VERCEL_URL ?? "zorixa-ai",
    environment:
      process.env.SENTRY_ENVIRONMENT?.trim() ||
      process.env.VERCEL_ENV ||
      process.env.NODE_ENV ||
      "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA || undefined,
    exception: {
      values: [
        {
          type: err.name,
          value: err.message,
          stacktrace: err.stack
            ? {
                frames: err.stack
                  .split("\n")
                  .slice(1, 12)
                  .map((line) => ({ filename: line.trim() }))
              }
            : undefined
        }
      ]
    },
    tags: {
      runtime: "nextjs"
    },
    extra: context
  };

  const endpoint = `https://${parsed.host}/api/${parsed.projectId}/store/`;

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=zorixa-report-error/1.0`
      },
      body: JSON.stringify(event),
      cache: "no-store"
    });
  } catch (sendErr) {
    console.warn("[reportError] failed to send to Sentry", sendErr);
  }
}

/** Fire-and-forget wrapper for route handlers. */
export function captureException(error: unknown, context?: ReportContext): void {
  void reportError(error, context);
}
