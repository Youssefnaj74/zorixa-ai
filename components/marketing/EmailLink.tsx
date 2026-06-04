import { Mail } from "lucide-react";

import { gmailComposeUrl } from "@/lib/site-brand";
import { cn } from "@/lib/utils";

export function EmailLink({
  email,
  className,
  size = "lg",
  subject
}: {
  email: string;
  className?: string;
  size?: "sm" | "lg";
  subject?: string;
}) {
  const large = size === "lg";

  return (
    <a
      href={gmailComposeUrl(email, subject)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold text-[#00e5ff] transition hover:text-white hover:underline",
        large ? "font-display text-xl" : "text-base font-medium",
        className
      )}
    >
      <Mail className={cn(large ? "size-5" : "size-4")} aria-hidden />
      {email}
    </a>
  );
}
