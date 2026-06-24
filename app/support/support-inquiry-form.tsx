"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Paperclip, X } from "lucide-react";

import { SUPPORT_TICKET_TYPES } from "@/data/support-issue-types";
import supportConfig from "@/data/support-config.json";
import { supportScreenshotAlt } from "@/lib/image-alt-text";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const ISSUE_TYPES = SUPPORT_TICKET_TYPES;

const FAQ = [
  {
    q: "How do credits work?",
    a: "Each generation spends credits based on the model and settings. Your balance is shown in the navbar. Buy more anytime from View Plans — credits stay on your account until used."
  },
  {
    q: "Why did my generation fail?",
    a: "Common causes: prompt policy filters, unsupported settings, or a temporary provider issue. Try a simpler prompt, check History for the error, and attach a screenshot when contacting support."
  },
  {
    q: "How long do videos take?",
    a: "Most clips finish in 1–5 minutes depending on model, duration, and resolution. Complex reference-to-video jobs can take longer. Leave the tab open or check History when complete."
  },
  {
    q: "Can I get a refund?",
    a: "Credits are generally non-refundable once purchased, except where required by law. For payment issues, use the Billing page with your Dodo Payments receipt."
  }
] as const;

const inputClass =
  "mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3.5 text-[15px] text-white outline-none placeholder:text-white/30 transition focus:border-[#00e5ff]/45 focus:ring-2 focus:ring-[#00e5ff]/15";

const selectClass =
  "mt-2 w-full appearance-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3.5 text-[15px] text-white outline-none transition focus:border-[#00e5ff]/45 focus:ring-2 focus:ring-[#00e5ff]/15";

function StatusBanner() {
  const { level, label, detail } = supportConfig.systemStatus;
  const styles =
    level === "outage"
      ? "border-red-500/30 bg-red-950/25 text-red-100"
      : level === "degraded"
        ? "border-amber-500/30 bg-amber-950/20 text-amber-100"
        : "border-emerald-500/25 bg-emerald-950/20 text-emerald-100";

  const dot =
    level === "outage" ? "bg-red-400" : level === "degraded" ? "bg-amber-400" : "bg-emerald-400";

  return (
    <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3", styles)}>
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", dot)} aria-hidden />
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {detail ? <p className="mt-0.5 text-xs opacity-80">{detail}</p> : null}
      </div>
    </div>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
        Frequently asked questions
      </h2>
      <div className="mt-3 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        {FAQ.map((item, index) => {
          const open = openIndex === index;
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-white/85 transition hover:text-white"
                aria-expanded={open}
              >
                {item.q}
                <ChevronDown
                  className={cn("size-4 shrink-0 text-white/40 transition-transform", open && "rotate-180")}
                  aria-hidden
                />
              </button>
              {open ? (
                <p className="border-t border-white/[0.06] px-4 pb-4 pt-2 text-sm leading-relaxed text-white/50">
                  {item.a}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SupportInquiryForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [issueType, setIssueType] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [message, setMessage] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    void (async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      if (user.email) setEmail(user.email);

      const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
      const fromMeta =
        (typeof meta?.full_name === "string" && meta.full_name) ||
        (typeof meta?.name === "string" && meta.name) ||
        "";

      if (fromMeta) {
        setName(fromMeta);
        return;
      }

      const { data: profile } = await supabase
        .from("users_profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (!cancelled && profile?.full_name) setName(profile.full_name);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onScreenshotPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/support/upload", { method: "POST", body: form });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Screenshot upload failed.");
        return;
      }
      setScreenshotUrl(data.url);
      setScreenshotName(file.name);
    } catch {
      setError("Screenshot upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function clearScreenshot() {
    setScreenshotUrl(null);
    setScreenshotName(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          issue_type: issueType,
          subject: ticketSubject,
          message,
          screenshot_url: screenshotUrl
        })
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not send your message. Try again.");
        return;
      }

      setSent(true);
      setMessage("");
      setIssueType("");
      setTicketSubject("");
      clearScreenshot();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-400" aria-hidden />
          <div>
            <p className="text-lg font-bold text-white">Support request sent</p>
            <p className="mt-2 text-sm text-white/60">
              We typically reply within <span className="font-semibold text-white">24–48 hours</span> at{" "}
              <span className="text-white">{email}</span>.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setError(null);
              }}
              className="mt-5 text-sm font-semibold text-[#00e5ff] hover:text-white"
            >
              Send another request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StatusBanner />
      <FaqSection />

      <section id="support-form">
        <h2 className="text-base font-bold text-white">Send a support request</h2>
        <p className="mt-2 text-sm text-white/50">
          Describe your issue and attach a screenshot if helpful.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Your name</span>
            <input
              className={inputClass}
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Email</span>
            <input
              className={inputClass}
              placeholder="you@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Issue type</span>
            <select
              className={selectClass}
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              required
            >
              <option value="" disabled className="bg-[#0f0f1a] text-white/50">
                Select a category…
              </option>
              {ISSUE_TYPES.map((item) => (
                <option key={item} value={item} className="bg-[#0f0f1a]">
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Subject</span>
            <input
              className={inputClass}
              placeholder="Video generation stuck at 95%"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              required
              minLength={5}
              maxLength={200}
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Message</span>
            <textarea
              className={cn(inputClass, "min-h-[140px] resize-y")}
              placeholder="Describe what happened — error text, model used, steps to reproduce…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              minLength={10}
              maxLength={4000}
            />
          </label>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Screenshot (optional)
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="sr-only"
              onChange={onScreenshotPick}
            />
            {!screenshotUrl ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || loading}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-sm font-semibold text-white/60 transition hover:border-[#00e5ff]/35 hover:text-white disabled:opacity-45"
              >
                <Paperclip className="size-4" aria-hidden />
                {uploading ? "Uploading…" : "Upload screenshot"}
              </button>
            ) : (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-white/10">
                  <Image src={screenshotUrl} alt={supportScreenshotAlt()} fill className="object-cover" sizes="56px" unoptimized />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{screenshotName}</p>
                  <p className="text-xs text-white/40">Attached to your request</p>
                </div>
                <button
                  type="button"
                  onClick={clearScreenshot}
                  className="flex size-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white"
                  aria-label="Remove screenshot"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
            <p className="mt-1.5 text-xs text-white/35">PNG, JPG, JPEG (Max 5MB)</p>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-950/25 px-4 py-3 text-sm text-red-100" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#8338eb] px-6 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-[#00e5ff]/10 transition hover:opacity-95 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send support request"}
          </button>
        </form>
      </section>
    </div>
  );
}
