import Image from "next/image";
import Link from "next/link";

import { zorixaLogoAlt } from "@/lib/image-alt-text";
import { cn } from "@/lib/utils";

type ZorixaLogoProps = {
  href?: string;
  className?: string;
  textClassName?: string;
  iconClassName?: string;
  showText?: boolean;
};

export function ZorixaLogo({
  href = "/",
  className,
  textClassName,
  iconClassName,
  showText = true
}: ZorixaLogoProps) {
  const content = (
    <>
      <Image
        src="/zorixa-z-letter.png"
        alt={zorixaLogoAlt()}
        width={30}
        height={30}
        className={cn("h-[30px] w-auto shrink-0", iconClassName)}
        priority
      />
      {showText ? (
        <span className={cn("font-display font-semibold tracking-tight text-white", textClassName)}>
          Zorixa AI
        </span>
      ) : null}
    </>
  );

  const wrapperClass = cn("inline-flex items-center gap-2 shrink-0", className);

  if (href) {
    return (
      <Link href={href} className={wrapperClass} aria-label="Zorixa AI">
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
