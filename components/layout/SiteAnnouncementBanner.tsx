import Link from "next/link";

import { SITE_ANNOUNCEMENT } from "@/lib/site-announcement";

/** Slim top promo bar — message + CTA grouped center (Enhancor-style, Zorixa brand). */
export function SiteAnnouncementBanner() {
  if (!SITE_ANNOUNCEMENT.enabled) return null;

  return (
    <div
      className="flex h-9 shrink-0 items-center justify-center gap-2 border-b border-brand/30 bg-gradient-brand px-4 lg:px-8"
      role="region"
      aria-label="Announcement"
    >
      <span className="text-[13px] font-semibold text-white sm:text-sm">{SITE_ANNOUNCEMENT.message}</span>
      <Link
        href={SITE_ANNOUNCEMENT.href}
        className="shrink-0 rounded-md border border-white/75 px-2.5 py-0.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
      >
        {SITE_ANNOUNCEMENT.ctaLabel}
      </Link>
    </div>
  );
}
