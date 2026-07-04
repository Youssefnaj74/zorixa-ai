import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/site-brand";

/** Canonical alternates for a public route (always resolves to https://www.zorixaai.com). */
export function siteCanonical(path: string): Pick<Metadata, "alternates"> {
  return { alternates: { canonical: absoluteUrl(path) } };
}
