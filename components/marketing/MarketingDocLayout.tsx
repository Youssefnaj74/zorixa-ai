import Link from "next/link";

import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const NAV_H = 56;

export function MarketingDocLayout({
  eyebrow,
  title,
  subtitle,
  maxWidthClass = "max-w-3xl",
  children
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#080810] font-body text-white">
      <Navbar />
      <main className="min-h-[calc(100dvh-56px)]" style={{ paddingTop: NAV_H }}>
        <div className={cn("mx-auto px-6 py-16 sm:py-20", maxWidthClass)}>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#00e5ff]">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white">{title}</h1>
          {subtitle ? <p className="mt-4 text-base leading-relaxed text-white/55">{subtitle}</p> : null}
          <div className="mt-12 space-y-8 text-sm leading-relaxed text-white/70">{children}</div>
          <p className="mt-14 text-sm text-white/40">
            <Link href="/faq" className="text-[#00e5ff] hover:underline">
              FAQ
            </Link>
            {" · "}
            <Link href="/contact" className="text-[#00e5ff] hover:underline">
              Contact
            </Link>
            {" · "}
            <Link href="/pricing" className="text-[#00e5ff] hover:underline">
              Pricing
            </Link>
            {" · "}
            <Link href="/affiliate" className="text-[#00e5ff] hover:underline">
              Affiliates
            </Link>
            {" · "}
            <Link href="/helpsupport" className="text-[#00e5ff] hover:underline">
              Help center
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
