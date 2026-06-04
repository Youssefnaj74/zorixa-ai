"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmailLink({
  email,
  className,
  size = "lg"
}: {
  email: string;
  className?: string;
  size?: "sm" | "lg";
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this email:", email);
    }
  }

  const large = size === "lg";

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <a
        href={`mailto:${email}`}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-bold text-[#00e5ff] transition hover:text-white hover:underline",
          large ? "font-display text-xl" : "text-base font-medium"
        )}
      >
        <Mail className={cn(large ? "size-5" : "size-4")} aria-hidden />
        {email}
      </a>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-[#00e5ff]/30 hover:text-white"
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-emerald-400" aria-hidden />
            Copied
          </>
        ) : (
          <>
            <Copy className="size-3.5" aria-hidden />
            Copy email
          </>
        )}
      </button>
      <p className="max-w-sm text-center text-xs text-white/40">
        If the link does not open your mail app, copy the address or use the form above — we reply by
        email.
      </p>
    </div>
  );
}
