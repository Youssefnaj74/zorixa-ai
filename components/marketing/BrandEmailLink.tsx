import Link from "next/link";

import { inquiryPathForEmail } from "@/lib/site-brand";
import { cn } from "@/lib/utils";

export function BrandEmailLink({
  email,
  className
}: {
  email: string;
  className?: string;
}) {
  const href = inquiryPathForEmail(email);

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn("text-[#00e5ff] transition hover:text-white hover:underline", className)}
    >
      {email}
    </Link>
  );
}
