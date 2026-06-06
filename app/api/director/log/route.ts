import { NextResponse } from "next/server";

import { insertDirectorRun, patchDirectorRunFeedback } from "@/lib/ai-director/log-run";
import type { DirectorRunMetadata } from "@/lib/ai-director/types";
import { rateLimit } from "@/lib/rate-limit";
import { resolveZorixaActor } from "@/lib/zorixa-mcp-auth";

/** Log AI Director routing + outcome (no extra credit charge). */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `director-log:${ip}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const actor = await resolveZorixaActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Partial<DirectorRunMetadata>;
  try {
    body = (await request.json()) as Partial<DirectorRunMetadata>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

  const id = await insertDirectorRun({
    userId: actor.userId,
    metadata: {
      style_requested: body.style_requested ?? "auto",
      style_resolved: body.style_resolved ?? "cinematic",
      routed_model: body.routed_model ?? "seedance-2",
      route_action: body.route_action ?? "text",
      prompt,
      success: body.success !== false,
      prediction_id: body.prediction_id ?? null,
      output_url: body.output_url ?? null,
      credits_spent: body.credits_spent ?? 0
    }
  });

  if (id == null) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  return NextResponse.json({ ok: true, run_id: id });
}

/** Record user_liked / user_downloaded for smarter routing later. */
export async function PATCH(request: Request) {
  const actor = await resolveZorixaActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { run_id?: number; user_liked?: boolean; user_downloaded?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const runId = typeof body.run_id === "number" ? body.run_id : NaN;
  if (!Number.isFinite(runId)) {
    return NextResponse.json({ error: "Missing run_id" }, { status: 400 });
  }

  const ok = await patchDirectorRunFeedback({
    userId: actor.userId,
    runId,
    user_liked: body.user_liked,
    user_downloaded: body.user_downloaded
  });

  return NextResponse.json({ ok });
}
