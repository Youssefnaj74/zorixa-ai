import Link from "next/link";

import { splitBlogInlineLinks } from "@/lib/blog";
import type { BlogSection } from "@/lib/blog/types";

function InlineText({ text }: { text: string }) {
  const parts = splitBlogInlineLinks(text);
  return (
    <>
      {parts.map((part, i) =>
        part.type === "link" && part.href ? (
          <Link key={i} href={part.href} className="text-[#00e5ff] hover:underline">
            {part.value}
          </Link>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </>
  );
}

export function BlogSectionContent({ section }: { section: BlogSection }) {
  const Tag = section.level === 3 ? "h3" : "h2";
  const tagClass =
    section.level === 3
      ? "mt-8 text-lg font-bold text-white"
      : "mt-12 scroll-mt-24 text-xl font-bold text-white sm:text-2xl";

  return (
    <section id={section.id} aria-labelledby={`${section.id}-heading`}>
      <Tag id={`${section.id}-heading`} className={tagClass}>
        {section.title}
      </Tag>
      {section.paragraphs.map((p) => (
        <p key={p.slice(0, 40)} className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
          <InlineText text={p} />
        </p>
      ))}
      {section.bullets?.length ? (
        <ul className="mt-4 list-none space-y-2 pl-0">
          {section.bullets.map((item) => (
            <li key={item.slice(0, 48)} className="flex items-start gap-2 text-sm leading-relaxed text-white/70">
              <span className="mt-1 text-[#00e5ff]" aria-hidden>
                —
              </span>
              <span>
                <InlineText text={item} />
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
