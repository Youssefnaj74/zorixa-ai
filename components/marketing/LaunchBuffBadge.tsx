import { cn } from "@/lib/utils";

const LAUNCHBUFF_URL = "https://launchbuff.com";
const BADGE_SRC = "https://launchbuff.com/badge-featured-dark.svg";

export function LaunchBuffBadge({ className }: { className?: string }) {
  return (
    <a
      href={LAUNCHBUFF_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Featured on LaunchBuff"
      className={cn("inline-block opacity-90 transition-opacity hover:opacity-100", className)}
    >
      <img
        src={BADGE_SRC}
        alt="Featured on LaunchBuff"
        width={256}
        height={80}
        className="h-auto w-[200px] sm:w-[256px]"
      />
    </a>
  );
}
