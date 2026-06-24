"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Sparkles, ZoomIn } from "lucide-react";

import { ExternalImage } from "@/components/ui/ExternalImage";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import {
  EXPLORE_PROMPT_MODEL_FILTERS,
  buildExplorePromptStudioHref,
  explorePromptPreviewCandidates,
  explorePromptsForModel,
  EXPLORE_PROMPT_UI_ASPECT_CLASS,
  type ExplorePromptEntry
} from "@/lib/explore-prompts-catalog";
import { explorePromptPreviewAlt } from "@/lib/image-alt-text";
import { cn } from "@/lib/utils";

function ExplorePreviewImage({
  entry,
  className,
  onReadyChange
}: {
  entry: ExplorePromptEntry;
  className?: string;
  onReadyChange?: (ready: boolean, src?: string) => void;
}) {
  const candidates = useMemo(() => explorePromptPreviewCandidates(entry), [entry]);
  const [index, setIndex] = useState(0);
  const src = candidates[index] ?? null;
  const onReadyChangeRef = useRef(onReadyChange);
  onReadyChangeRef.current = onReadyChange;

  useEffect(() => {
    setIndex(0);
    onReadyChangeRef.current?.(false);
  }, [entry.id, entry.imageUrl]);

  if (!src) return null;

  return (
    <ExternalImage
      key={`${entry.id}-${src}`}
      src={src}
      alt={explorePromptPreviewAlt(entry.title)}
      onLoad={() => onReadyChangeRef.current?.(true, src)}
      onError={() => {
        if (index + 1 < candidates.length) {
          setIndex((i) => i + 1);
          return;
        }
        onReadyChangeRef.current?.(false);
      }}
      className={className}
    />
  );
}

function ExplorePreviewPlaceholder({ entryId }: { entryId: string }) {
  return (
    <div className="flex min-h-[280px] w-full flex-col items-center justify-center gap-2 bg-[#0d0d0d] p-6 text-center sm:min-h-[360px]">
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">Preview</span>
      <p className="text-xs text-white/40">
        Generate in Image studio, then save preview under{" "}
        <code className="text-white/55">public/explore-prompts/{entryId}.png</code>
      </p>
    </div>
  );
}

function ExploreGridTile({
  entry,
  onZoom
}: {
  entry: ExplorePromptEntry;
  onZoom: (entry: ExplorePromptEntry, src: string) => void;
}) {
  const router = useRouter();
  const href = buildExplorePromptStudioHref(entry);
  const [previewOk, setPreviewOk] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  const copyPrompt = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void navigator.clipboard.writeText(entry.prompt);
  };

  return (
    <article className="group relative break-inside-avoid">
      <button
        type="button"
        onClick={() => router.push(href)}
        className="relative block w-full overflow-hidden rounded-2xl bg-[#0d0d0d] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        aria-label={`Use prompt: ${entry.title}`}
      >
        <div className="relative w-full overflow-hidden">
          {!previewOk ? <ExplorePreviewPlaceholder entryId={entry.id} /> : null}
          <ExplorePreviewImage
            entry={entry}
            onReadyChange={(ready, src) => {
              setPreviewOk(ready);
              if (ready && src) setLoadedSrc(src);
            }}
            className={cn(
              "block w-full object-cover transition-transform duration-500",
              previewOk ? EXPLORE_PROMPT_UI_ASPECT_CLASS : "absolute inset-0 size-full opacity-0",
              previewOk && "group-hover:scale-[1.03]"
            )}
          />
          <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
          {previewOk ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                <Sparkles className="size-3.5" aria-hidden />
                Use prompt
              </span>
            </div>
          ) : null}
        </div>
      </button>
      {previewOk ? (
        <div className="absolute right-2 top-2 z-10 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onZoom(entry, loadedSrc ?? explorePromptPreviewCandidates(entry)[0] ?? "");
            }}
            className="grid size-8 place-items-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-sm hover:bg-black/75"
            title="Zoom preview"
            aria-label={`Zoom ${entry.title}`}
          >
            <ZoomIn className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={copyPrompt}
            className="grid size-8 place-items-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-sm hover:bg-black/75"
            title="Copy prompt"
            aria-label={`Copy prompt for ${entry.title}`}
          >
            <Copy className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function ExplorePromptsView() {
  const searchParams = useSearchParams();
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [lightboxEntry, setLightboxEntry] = useState<ExplorePromptEntry | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const openLightbox = (entry: ExplorePromptEntry, src: string) => {
    setLightboxEntry(entry);
    setLightboxSrc(src);
  };

  useEffect(() => {
    const raw = searchParams.get("model")?.trim();
    if (!raw) return;
    const exists = EXPLORE_PROMPT_MODEL_FILTERS.some((f) => f.id === raw);
    if (exists) setModelFilter(raw);
  }, [searchParams]);

  const items = useMemo(() => explorePromptsForModel(modelFilter), [modelFilter]);

  const filterLabel =
    EXPLORE_PROMPT_MODEL_FILTERS.find((f) => f.id === modelFilter)?.label ?? "All";

  return (
    <div className="mx-auto flex w-full max-w-[1600px] gap-0 px-4 pb-16 pt-5 sm:px-6 lg:gap-10 lg:px-10">
      <aside className="hidden w-[200px] shrink-0 lg:block">
        <nav className="sticky top-[4.5rem] space-y-0.5">
          {EXPLORE_PROMPT_MODEL_FILTERS.map((f) => {
            const active = modelFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setModelFilter(f.id)}
                className={cn(
                  "flex w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-[#3b82f6] text-white shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                    : "text-white/45 hover:bg-white/[0.05] hover:text-white/85"
                )}
              >
                <span className="truncate">{f.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-[1.75rem]">
            Explore prompts
          </h1>
        </header>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EXPLORE_PROMPT_MODEL_FILTERS.map((f) => {
            const active = modelFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setModelFilter(f.id)}
                className={cn(
                  "shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium",
                  active
                    ? "bg-[#3b82f6] text-white"
                    : "text-white/45 hover:text-white/80"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {items.length === 0 ? (
          <div className="flex min-h-[45vh] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 text-center">
            <p className="text-sm text-white/50">
              No prompts yet
              {modelFilter !== "all" ? (
                <>
                  {" "}
                  for <span className="text-white/80">{filterLabel}</span>
                </>
              ) : null}
              .
            </p>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-white/35">
              Add entries in{" "}
              <code className="rounded bg-white/[0.06] px-1 py-0.5 text-white/55">
                lib/explore-prompts-catalog.ts
              </code>
              .
            </p>
            {modelFilter !== "all" ? (
              <button
                type="button"
                onClick={() => setModelFilter("all")}
                className="mt-5 text-sm font-medium text-[#3b82f6] hover:underline"
              >
                Show all models
              </button>
            ) : null}
          </div>
        ) : (
          <div
            className={cn(
              "columns-2 gap-x-2.5 sm:columns-3 sm:gap-x-3",
              "md:columns-3 lg:columns-4"
            )}
          >
            {items.map((entry) => (
              <div key={entry.id} className="mb-2.5 sm:mb-3">
                <ExploreGridTile entry={entry} onZoom={openLightbox} />
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxEntry ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[110] flex justify-center px-4">
          <Link
            href={buildExplorePromptStudioHref(lightboxEntry)}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.02]"
          >
            <Sparkles className="size-4" aria-hidden />
            Use prompt
          </Link>
        </div>
      ) : null}

      <ImageLightbox
        open={lightboxEntry !== null}
        src={lightboxSrc}
        alt={lightboxEntry?.title ?? "Preview"}
        title={lightboxEntry?.title}
        onClose={() => {
          setLightboxEntry(null);
          setLightboxSrc(null);
        }}
      />
    </div>
  );
}
