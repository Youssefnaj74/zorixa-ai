"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

export function AssistantMarkdown({
  content,
  className
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-invert max-w-none text-sm leading-relaxed text-white/90",
        "prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
        "prose-headings:font-display prose-headings:text-white prose-strong:text-white",
        "prose-a:text-[#9b5cf6] prose-code:text-[#c4b5fd]",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[12px] leading-relaxed">
              {children}
            </pre>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isBlock = Boolean(codeClassName);
            if (isBlock) {
              return (
                <code className={cn("font-mono text-[12px]", codeClassName)} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="rounded bg-white/10 px-1 py-0.5 font-mono text-[12px] text-[#c4b5fd]"
                {...props}
              >
                {children}
              </code>
            );
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
              {children}
            </a>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
