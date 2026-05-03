import { cn } from "@/lib/utils";

type StudioShellProps = {
  title: string;
  subtitle: string;
  left: React.ReactNode;
  right: React.ReactNode;
  leftFooter?: React.ReactNode;
  /** Bottom bar on the canvas column (e.g. Image studio Generate) */
  rightFooter?: React.ReactNode;
  badge?: string;
};

export function StudioShell({
  title,
  subtitle,
  left,
  right,
  leftFooter,
  rightFooter,
  badge
}: StudioShellProps) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-studio-canvas lg:max-h-[calc(100dvh-0.5rem)] lg:flex-row">
      <aside
        className={cn(
          "flex w-full max-w-full shrink-0 flex-col border-studio-line bg-studio-canvas lg:max-w-[26rem] lg:border-r"
        )}
      >
        <div className="border-b border-studio-line px-5 py-5 lg:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-heading text-lg font-semibold tracking-tight text-white">{title}</h1>
              <p className="mt-1 font-body text-sm leading-relaxed text-white/50">{subtitle}</p>
            </div>
            {badge ? (
              <span className="shrink-0 rounded-full border border-studio-accent/35 bg-studio-accent/12 px-2.5 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-wider text-studio-accent">
                {badge}
              </span>
            ) : null}
          </div>
        </div>

        <div className="studio-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5 lg:px-6">
          {left}
        </div>

        {leftFooter ? (
          <div className="border-t border-studio-line bg-studio-canvas p-4 lg:p-5">{leftFooter}</div>
        ) : null}
      </aside>

      <section className="relative flex min-h-[min(70vh,560px)] min-w-0 flex-1 flex-col bg-studio-canvas lg:min-h-0">
        <div className="relative flex min-h-0 flex-1 flex-col">{right}</div>
        {rightFooter ? (
          <div className="shrink-0 border-t border-studio-line bg-studio-canvas px-5 py-4 lg:px-8">
            {rightFooter}
          </div>
        ) : null}
      </section>
    </div>
  );
}
