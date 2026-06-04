import Link from "next/link";

import { BRAND_INQUIRY_PATHS, BRAND_EMAILS } from "@/lib/site-brand";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#080810] px-6 text-center text-white">
      <p className="text-6xl font-black tracking-tight">404</p>
      <h1 className="mt-4 text-xl font-bold text-white/90">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-white/50">
        This link may be outdated. Use one of the pages below to contact us.
      </p>
      <ul className="mt-8 space-y-2 text-sm">
        <li>
          <Link href="/" className="text-[#00e5ff] hover:underline">
            Home
          </Link>
        </li>
        <li>
          <Link href={BRAND_INQUIRY_PATHS.support} className="text-[#00e5ff] hover:underline">
            Support — {BRAND_EMAILS.support}
          </Link>
        </li>
        <li>
          <Link href={BRAND_INQUIRY_PATHS.billing} className="text-[#00e5ff] hover:underline">
            Billing — {BRAND_EMAILS.billing}
          </Link>
        </li>
        <li>
          <Link href={BRAND_INQUIRY_PATHS.contact} className="text-[#00e5ff] hover:underline">
            Contact — {BRAND_EMAILS.contact}
          </Link>
        </li>
        <li>
          <Link href={BRAND_INQUIRY_PATHS.abuse} className="text-[#00e5ff] hover:underline">
            Abuse — {BRAND_EMAILS.abuse}
          </Link>
        </li>
      </ul>
    </div>
  );
}
