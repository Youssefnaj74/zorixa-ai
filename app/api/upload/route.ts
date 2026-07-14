import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Atlas source-video refs are capped around 100MB; keep uploads in the same ballpark. */
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export const runtime = "nodejs";
export const maxDuration = 60;

function extensionForUpload(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) return fromName;
  const mt = (file.type || "").toLowerCase();
  if (mt.includes("jpeg") || mt === "image/jpg") return "jpg";
  if (mt === "image/png") return "png";
  if (mt === "image/webp") return "webp";
  if (mt === "image/gif") return "gif";
  if (mt.startsWith("audio/")) return "mp3";
  if (mt.startsWith("video/")) return "mp4";
  return "bin";
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `upload:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error:
          "Upload failed — file is too large for this request. Use a video under 100MB (shorter clips work best)."
      },
      { status: 413 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error: `Upload failed — file is ${(file.size / (1024 * 1024)).toFixed(0)}MB. Max is 100MB.`
      },
      { status: 413 }
    );
  }

  const ext = extensionForUpload(file);
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await supabaseAdmin.storage.from("uploads").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (uploadErr) {
    const detail = uploadErr.message?.trim();
    const looksLikeSize =
      /size|too large|maximum|payload|entity too large/i.test(detail || "") ||
      /413/.test(detail || "");
    return NextResponse.json(
      {
        error: looksLikeSize
          ? "Upload failed — file is too large for storage. Try a shorter/smaller video (under 100MB)."
          : detail
            ? `Upload failed — ${detail}`
            : "Upload failed. Ensure you created a Supabase Storage bucket named 'uploads'."
      },
      { status: looksLikeSize ? 413 : 500 }
    );
  }

  const { data } = supabaseAdmin.storage.from("uploads").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
