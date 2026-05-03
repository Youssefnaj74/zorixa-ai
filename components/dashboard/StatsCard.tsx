import { cn } from "@/lib/utils";

export function StatsCard({
  title,
  value,
  hint,
  className
}: {
  title: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "zorixa-card-border rounded-2xl bg-zorixa-card p-5 shadow-glow transition-shadow hover:shadow-glow-lg",
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-zorixa-muted">{title}</p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zorixa-muted">{hint}</p> : null}
    </div>
  );
}
