"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import {
  affiliateApplyMailto
} from "@/lib/affiliate-config";

const TALLY_EMBED_SCRIPT = "https://tally.so/widgets/embed.js";

const applyButtonClass =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90";

const formCardClass =
  "mx-auto w-full max-w-4xl rounded-2xl border border-white/5 bg-[#0a0a0a] p-4 sm:p-8";

type AffiliateApplyFormProps = {
  tallyEmbedUrl: string | null;
  formUrl: string | null;
};

function loadTallyEmbeds() {
  const iframes = document.querySelectorAll<HTMLIFrameElement>("iframe[data-tally-src]:not([src])");
  iframes.forEach((iframe) => {
    iframe.src = iframe.dataset.tallySrc ?? "";
  });

  const tally = (window as Window & { Tally?: { loadEmbeds: () => void } }).Tally;
  tally?.loadEmbeds();
}

function TallyEmbed({ embedUrl }: { embedUrl: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const init = () => loadTallyEmbeds();

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
    <div className={formCardClass}>
      <div className="overflow-hidden rounded-xl bg-white/[0.02]">
        <iframe
          ref={iframeRef}
          data-tally-src={embedUrl}
          loading="lazy"
          width="100%"
          height="600"
          frameBorder={0}
          marginHeight={0}
          marginWidth={0}
          title="Zorixa AI affiliate application"
          className="block w-full min-h-[600px] border-0 bg-transparent"
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

export function AffiliateApplyForm({ tallyEmbedUrl, formUrl }: AffiliateApplyFormProps) {
  if (tallyEmbedUrl) {
    return <TallyEmbed embedUrl={tallyEmbedUrl} />;
  }

  if (formUrl) {
    return (
      <div className={cn(formCardClass, "text-center")}>
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
    <div className={cn(formCardClass, "text-center")}>
      <p className="text-sm text-white/60">
        Email us your channel links and audience size. We&apos;ll send your affiliate link after approval.
      </p>
      <Link href={affiliateApplyMailto()} className={cn(applyButtonClass, "mt-6")}>
        Apply by email
      </Link>
    </div>
  );
}
