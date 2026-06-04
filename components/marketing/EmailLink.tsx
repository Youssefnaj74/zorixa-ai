import Link from "next/link";
import { Mail } from "lucide-react";

import { inquiryPathForEmail } from "@/lib/site-brand";
import { cn } from "@/lib/utils";

export function EmailLink({
  email,
  className,
  size = "lg"
}: {
  email: string;
  className?: string;
  size?: "sm" | "lg";
}) {
  const large = size === "lg";
  const href = inquiryPathForEmail(email);

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold text-[#00e5ff] transition hover:text-white hover:underline",
        large ? "font-display text-xl" : "text-base font-medium",
        className
      )}
    >
      <Mail className={cn(large ? "size-5" : "size-4")} aria-hidden />
      {email}
    </Link>
  );
}
