import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `upload:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await supabaseAdmin.storage
    .from("uploads")
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

  if (uploadErr) {
    return NextResponse.json(
      {
        error:
          "Upload failed. Ensure you created a Supabase Storage bucket named 'uploads'."
      },
      { status: 500 }
    );
  }

  const { data } = supabaseAdmin.storage.from("uploads").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}

