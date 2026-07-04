import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";
import { siteCanonical } from "@/lib/site-metadata";

export const metadata: Metadata = siteCanonical("/");

export default function Page() {
  return <LandingPage />;
}
