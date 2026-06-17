import Link from "next/link";

import { getModelSeoPage } from "@/lib/model-seo-catalog";

export function BlogModelLinks({ slugs }: { slugs: string[] }) {
  const models = slugs.map((slug) => getModelSeoPage(slug)).filter(Boolean);
  if (!models.length) return null;

  return (
    <section className="mt-10 rounded-2xl border border-[#00e5ff]/20 bg-[#00e5ff]/5 p-5 sm:p-6">
      <h2 className="text-sm font-bold uppercase tracking-widest text-[#7ee9ff]">Related models</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {models.map((model) =>
          model ? (
            <li key={model.slug}>
              <Link
                href={`/models/${model.slug}`}
                className="inline-flex rounded-full border border-[#00e5ff]/30 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white/85 hover:border-[#00e5ff]/50"
              >
                {model.name}
              </Link>
            </li>
          ) : null
        )}
      </ul>
      <p className="mt-3 text-xs text-white/45">
        Open the studio pre-configured from each model page —{" "}
        <Link href="/video" className="text-[#00e5ff] hover:underline">
          video studio
        </Link>
        .
      </p>
    </section>
  );
}
