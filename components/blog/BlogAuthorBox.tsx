import Link from "next/link";

import type { BlogAuthor } from "@/lib/blog/types";
import { FOUNDER_LINKEDIN_URL } from "@/lib/site-brand";

export function BlogAuthorBox({ author }: { author: BlogAuthor }) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/45">Author</p>
      <p className="mt-2 text-lg font-bold text-white">{author.name}</p>
      <p className="text-sm text-[#00e5ff]/90">{author.role}</p>
      <p className="mt-3 text-sm leading-relaxed text-white/60">{author.bio}</p>
      {FOUNDER_LINKEDIN_URL ? (
        <p className="mt-4">
          <a
            href={FOUNDER_LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#00e5ff] hover:underline"
          >
            LinkedIn →
          </a>
        </p>
      ) : (
        <p className="mt-4">
          <Link href="/about" className="text-sm text-[#00e5ff] hover:underline">
            About Zorixa AI →
          </Link>
        </p>
      )}
    </aside>
  );
}
