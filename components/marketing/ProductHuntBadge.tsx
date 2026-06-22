import { cn } from "@/lib/utils";

const PRODUCT_HUNT_URL =
  "https://www.producthunt.com/products/zorixa-ai?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-zorixa-ai";

const BADGE_SRC =
  "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1165902&theme=dark";

export function ProductHuntBadge({ className }: { className?: string }) {
  return (
    <a
      href={PRODUCT_HUNT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-block opacity-90 transition-opacity hover:opacity-100", className)}
    >
      <img
        alt="Zorixa AI - Multi-model AI video studio — pay only for what you generate | Product Hunt"
        width={250}
        height={54}
        src={BADGE_SRC}
        className="h-auto w-[210px] sm:w-[250px]"
      />
    </a>
  );
}
