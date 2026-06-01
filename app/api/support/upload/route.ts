import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `support-upload:${ip}`, limit: 10, windowMs: 60 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPG, or JPEG screenshots are allowed." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Screenshot must be 5 MB or smaller." }, { status: 400 });
  }

  const ext = file.type === "image/jpeg" ? "jpg" : "png";

  const path = `support/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadErr } = await supabaseAdmin.storage.from("uploads").upload(path, bytes, {
    contentType: file.type,
    upsert: false
  });

  if (uploadErr) {
    console.error("[support-upload]", uploadErr.message);
    return NextResponse.json({ error: "Upload failed. Try again or send without a screenshot." }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from("uploads").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
