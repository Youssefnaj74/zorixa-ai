"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  affiliateApplyMailto,
  getAffiliateFormUrl,
  getAffiliateTallyEmbedUrl
} from "@/lib/affiliate-config";

type AffiliateApplyFormProps = {
  tallyEmbedUrl: string | null;
  formUrl: string | null;
};

export function AffiliateApplyForm({ tallyEmbedUrl, formUrl }: AffiliateApplyFormProps) {
  if (tallyEmbedUrl) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <iframe
          data-tally-src={tallyEmbedUrl}
          src={tallyEmbedUrl}
          loading="lazy"
          width="100%"
          height="520"
          frameBorder={0}
          marginHeight={0}
          marginWidth={0}
          title="Zorixa AI affiliate application"
          className="min-h-[520px] w-full bg-transparent"
        />
      </div>
    );
  }

  if (formUrl) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-10 text-center">
        <p className="text-sm text-white/60">
          Apply in under two minutes. We review applications within 48 hours.
        </p>
        <Button asChild className="mt-6 bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90">
          <Link href={formUrl} target="_blank" rel="noopener noreferrer">
            Open application form
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-10 text-center">
      <p className="text-sm text-white/60">
        Email us your channel links and audience size. We&apos;ll send your affiliate link after approval.
      </p>
      <Button asChild className="mt-6 bg-[#00e5ff] text-black hover:bg-[#00e5ff]/90">
        <Link href={affiliateApplyMailto()}>Apply by email</Link>
      </Button>
    </div>
  );
}
