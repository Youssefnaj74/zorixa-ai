"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { affiliateApplyMailto } from "@/lib/affiliate-config";

const TALLY_EMBED_SCRIPT = "https://tally.so/widgets/embed.js";

const applyButtonClass =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90";

const fallbackCardClass =
  "mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-10 text-center sm:px-10";

type AffiliateApplyFormProps = {
  tallyEmbedUrl: string | null;
  formUrl: string | null;
};

function loadTallyEmbeds() {
  const tally = (window as Window & { Tally?: { loadEmbeds: () => void } }).Tally;
  if (tally) {
    tally.loadEmbeds();
    return;
  }

  document.querySelectorAll<HTMLIFrameElement>("iframe[data-tally-src]:not([src])").forEach((iframe) => {
    iframe.src = iframe.dataset.tallySrc ?? "";
  });
}

function TallyEmbed({ embedUrl }: { embedUrl: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);

    const init = () => {
      loadTallyEmbeds();
      setReady(true);
    };

    const existing = document.querySelector(`script[src="${TALLY_EMBED_SCRIPT}"]`);
    if (existing) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.src = TALLY_EMBED_SCRIPT;
    script.async = true;
    script.onload = init;
    script.onerror = init;
    document.body.appendChild(script);
  }, [embedUrl]);

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      {!ready ? (
        <div className="flex min-h-[420px] items-center justify-center text-sm text-white/40">
          Loading application form…
        </div>
      ) : null}
      <iframe
        data-tally-src={embedUrl}
        loading="lazy"
        width="100%"
        height="280"
        frameBorder={0}
        marginHeight={0}
        marginWidth={0}
        title="Zorixa AI affiliate application"
        className={cn(
          "block w-full border-0 bg-transparent",
          !ready && "absolute inset-0 h-0 min-h-0 overflow-hidden opacity-0"
        )}
        style={{ width: "100%" }}
      />
    </div>
  );
}

export function AffiliateApplyForm({ tallyEmbedUrl, formUrl }: AffiliateApplyFormProps) {
  if (tallyEmbedUrl) {
    return <TallyEmbed embedUrl={tallyEmbedUrl} />;
  }

  if (formUrl) {
    return (
      <div className={fallbackCardClass}>
        <p className="text-sm text-white/60">
          Apply in under two minutes. We review applications within 48 hours.
        </p>
        <Link
          href={formUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(applyButtonClass, "mt-6")}
        >
          Open application form
        </Link>
      </div>
    );
  }

  return (
    <div className={fallbackCardClass}>
      <p className="text-sm text-white/60">
        Email us your channel links and audience size. We&apos;ll send your affiliate link after approval.
      </p>
      <Link href={affiliateApplyMailto()} className={cn(applyButtonClass, "mt-6")}>
        Apply by email
      </Link>
    </div>
  );
}
