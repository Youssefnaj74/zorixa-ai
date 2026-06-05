"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { BrandEmailLink } from "@/components/marketing/BrandEmailLink";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const CONTACT_TOPICS = [
  "General Inquiry",
  "Business & Partnership",
  "Press & Media",
  "Other"
] as const;

const inputClass =
  "mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3.5 text-[15px] text-white outline-none placeholder:text-white/30 transition focus:border-[#00e5ff]/45 focus:ring-2 focus:ring-[#00e5ff]/15";

const selectClass =
  "mt-2 w-full appearance-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3.5 text-[15px] text-white outline-none transition focus:border-[#00e5ff]/45 focus:ring-2 focus:ring-[#00e5ff]/15";

export function ContactForm({
  fixedIssueType,
  issueTypes,
  topicLabel = "Topic",
  subjectPlaceholder = "How can we help?",
  messagePlaceholder = "Tell us what you need…",
  sendLabel = "Send message",
  hideSubject = false
}: {
  fixedIssueType?: string;
  issueTypes?: readonly string[];
  topicLabel?: string;
  subjectPlaceholder?: string;
  messagePlaceholder?: string;
  sendLabel?: string;
  hideSubject?: boolean;
} = {}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
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
      if (!user || cancelled) return;

      if (user.email) setEmail(user.email);

      const fromMeta =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "";
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const trimmedMessage = message.trim();
      let resolvedSubject = subject.trim();
      if (hideSubject) {
        const fromMessage = trimmedMessage.replace(/\s+/g, " ").slice(0, 120);
        resolvedSubject = fromMessage.length >= 5 ? fromMessage : "Support request via website";
      }

      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          issue_type: fixedIssueType ?? topic,
          subject: resolvedSubject,
          message: trimmedMessage
        })
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not send your message. Try again.");
        return;
      }

      setSent(true);
      setMessage("");
      setSubject("");
      setTopic("");
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
            <p className="text-lg font-bold text-white">Message sent</p>
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
              Send another message
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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

      {fixedIssueType || issueTypes ? null : (
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
            {topicLabel}
          </span>
          <select
            className={selectClass}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          >
            <option value="" disabled className="bg-[#0f0f1a] text-white/50">
              Select…
            </option>
            {CONTACT_TOPICS.map((item) => (
              <option key={item} value={item} className="bg-[#0f0f1a]">
                {item}
              </option>
            ))}
          </select>
        </label>
      )}

      {issueTypes && !fixedIssueType ? (
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
            {topicLabel}
          </span>
          <select
            className={selectClass}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          >
            <option value="" disabled className="bg-[#0f0f1a] text-white/50">
              Select…
            </option>
            {issueTypes.map((item) => (
              <option key={item} value={item} className="bg-[#0f0f1a]">
                {item}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {hideSubject ? null : (
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Subject</span>
          <input
            className={inputClass}
            placeholder={subjectPlaceholder}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            minLength={5}
            maxLength={200}
          />
        </label>
      )}

      <label className="block">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Message</span>
        <textarea
          className={cn(inputClass, "min-h-[140px] resize-y")}
          placeholder={messagePlaceholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
          maxLength={4000}
        />
      </label>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-950/25 px-4 py-3 text-sm text-red-100" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#8338eb] px-6 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-[#00e5ff]/10 transition hover:opacity-95 disabled:opacity-50"
      >
        {loading ? "Sending…" : sendLabel}
      </button>
    </form>
  );
}

export function ContactEmailCard({
  email,
  showEmailLink = true
}: {
  email: string;
  showEmailLink?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <p className="text-sm font-semibold text-white">Email</p>
      <div className="mt-2">
        {showEmailLink ? (
          <BrandEmailLink email={email} className="text-base font-medium" />
        ) : (
          <p className="text-base font-medium text-[#00e5ff]">{email}</p>
        )}
      </div>
      <p className="mt-4 text-sm text-white/45">
        For credits, generation help, or FAQs, visit the{" "}
        <a href="/helpsupport" className="text-[#00e5ff] hover:underline">
          Help center
        </a>
        .
      </p>
    </div>
  );
}
