import { NextResponse } from "next/server";

import { rateLimit } from "@/lib/rate-limit";
import { BRAND_EMAILS } from "@/lib/site-brand";
import { sendSupportTicketEmails } from "@/lib/support-ticket-email";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ISSUE_TYPES = new Set([
  "Billing & Payments",
  "Credits Issue",
  "Image Generation",
  "Video Generation",
  "Account Problem",
  "Feature Request",
  "Bug Report",
  "General Inquiry",
  "Business & Partnership",
  "Press & Media",
  "Other",
  "Abuse Report"
]);

function cleanText(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidScreenshotUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit({ key: `support:${ip}`, limit: 5, windowMs: 60 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let body: {
    name?: unknown;
    email?: unknown;
    issue_type?: unknown;
    subject?: unknown;
    message?: unknown;
    screenshot_url?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 254)?.toLowerCase() ?? null;
  const issue_type = cleanText(body.issue_type, 80);
  const subject = cleanText(body.subject, 200);
  const message = cleanText(body.message, 4000);
  const screenshotRaw = cleanText(body.screenshot_url, 2048);
  const screenshot_url =
    screenshotRaw && isValidScreenshotUrl(screenshotRaw) ? screenshotRaw : null;

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!issue_type || !ISSUE_TYPES.has(issue_type)) {
    return NextResponse.json({ error: "Please select an issue type." }, { status: 400 });
  }
  if (!subject || subject.length < 5) {
    return NextResponse.json({ error: "Please enter a short subject (at least 5 characters)." }, { status: 400 });
  }
  if (!message || message.length < 10) {
    return NextResponse.json({ error: "Please describe your issue (at least 10 characters)." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { error: insertErr } = await supabaseAdmin.from("support_requests").insert({
    user_id: user?.id ?? null,
    name,
    email,
    issue_type,
    subject,
    message,
    screenshot_url
  });

  if (insertErr) {
    console.error("[support]", insertErr.message);
    return NextResponse.json(
      {
        error: `Could not save your message. Please email ${BRAND_EMAILS.support} directly.`
      },
      { status: 500 }
    );
  }

  void sendSupportTicketEmails({
    name,
    email,
    issue_type,
    subject,
    message,
    screenshot_url
  });

  return NextResponse.json({ ok: true });
}
