import type { Metadata } from "next";

import { siteCanonical } from "@/lib/site-metadata";

export const metadata: Metadata = siteCanonical("/signup");

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
