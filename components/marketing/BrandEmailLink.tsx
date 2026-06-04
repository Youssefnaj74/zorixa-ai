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
  return (
    <Link
      href={inquiryPathForEmail(email)}
      className={cn("text-[#00e5ff] transition hover:text-white hover:underline", className)}
    >
      {email}
    </Link>
  );
}
