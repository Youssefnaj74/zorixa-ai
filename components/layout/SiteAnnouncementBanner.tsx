import Link from "next/link";

import { SITE_ANNOUNCEMENT } from "@/lib/site-announcement";

/** Slim top promo bar — Zorixa brand gradient, Enhancor-style layout without the bullet dot. */
export function SiteAnnouncementBanner() {
  if (!SITE_ANNOUNCEMENT.enabled) return null;

  return (
    <div
      className="flex h-9 shrink-0 items-center justify-center gap-3 border-b border-brand/30 bg-gradient-brand px-4 sm:justify-between lg:px-8"
      role="region"
      aria-label="Announcement"
    >
      <Link
        href={SITE_ANNOUNCEMENT.href}
        className="min-w-0 flex-1 truncate text-center text-[13px] font-semibold text-white transition-opacity hover:opacity-90 sm:text-sm"
      >
        {SITE_ANNOUNCEMENT.message}
      </Link>
      <Link
        href={SITE_ANNOUNCEMENT.href}
        className="hidden shrink-0 rounded-md border border-white/75 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/10 sm:inline-flex"
      >
        {SITE_ANNOUNCEMENT.ctaLabel}
      </Link>
    </div>
  );
}
