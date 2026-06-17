import Link from "next/link";

import type { BlogSection } from "@/lib/blog/types";
import { cn } from "@/lib/utils";

export function BlogTableOfContents({
  sections,
  className
}: {
  sections: BlogSection[];
  className?: string;
}) {
  const items = sections.filter((s) => s.level !== 3);

  if (!items.length) return null;

  return (
    <nav aria-label="Table of contents" className={cn("rounded-xl border border-white/10 bg-white/[0.03] p-4", className)}>
      <p className="text-xs font-semibold uppercase tracking-widest text-white/45">On this page</p>
      <ol className="mt-3 space-y-2">
        {items.map((section) => (
          <li key={section.id}>
            <Link
              href={`#${section.id}`}
              className="text-sm text-white/65 transition hover:text-[#00e5ff]"
            >
              {section.title}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
