import { cn } from "@/lib/utils";

export type DashboardNewsItem = {
  title: string;
  description: string;
  showModelBadge?: boolean;
};

export type LatestNewsCardProps = {
  items: DashboardNewsItem[];
  className?: string;
};

export function LatestNewsCard({ items, className }: LatestNewsCardProps) {
  return (
    <aside
      className={cn(
        "rounded-2xl border border-surface-border bg-surface-card p-5 font-body",
        className
      )}
    >
      <p className="font-heading text-xs font-semibold uppercase tracking-widest text-white/50">
        Latest news
      </p>
      <ul className="mt-4 divide-y divide-surface-border">
        {items.map((item) => (
          <li key={item.title} className="py-4 first:pt-0 last:pb-0">
            {item.showModelBadge !== false ? (
              <span className="inline-flex rounded-full border border-brand/30 bg-brand/20 px-2 py-0.5 font-heading text-xs font-semibold text-brand">
                NEW MODEL
              </span>
            ) : null}
            <p
              className={cn(
                "font-heading text-sm font-bold text-white",
                item.showModelBadge !== false && "mt-2"
              )}
            >
              {item.title}
            </p>
            <p className="mt-1 font-body text-sm leading-relaxed text-white/50">{item.description}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
