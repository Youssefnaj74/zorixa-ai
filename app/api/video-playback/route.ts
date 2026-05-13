import { NextResponse } from "next/server";

import { isAllowedVideoPlaybackHost } from "@/lib/video-playback-proxy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Authenticated 302 to an allowlisted HTTPS video URL so the browser can follow
 * to the CDN without our server buffering the file (preserves signed / one-shot links).
 */
export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url")?.trim();
  if (!target) {
    return NextResponse.json({ error: "Missing url query parameter" }, { status: 400 });
  }

  let remote: URL;
  try {
    remote = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (remote.protocol !== "https:") {
    return NextResponse.json({ error: "Only https URLs are allowed" }, { status: 400 });
  }

  if (!isAllowedVideoPlaybackHost(remote.hostname)) {
    return NextResponse.json({ error: "Video host not allowed" }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(remote.toString(), 302);
}
