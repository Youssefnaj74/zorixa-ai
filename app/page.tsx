import Link from "next/link";
import Image from "next/image";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600"
] as const;

const NAV_LINKS = [
  { href: "/image", label: "Create" },
  { href: "/video", label: "Tools" },
  { href: "/dashboard/history", label: "Gallery" },
  { href: "/dashboard/billing", label: "Pricing" }
] as const;

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh bg-black text-white antialiased">
      <div className="absolute inset-0 grid h-dvh min-h-dvh grid-cols-3">
        {HERO_IMAGES.map((src, i) => (
          <div key={src} className="relative h-full min-h-0">
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              sizes="33vw"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-black/65" aria-hidden />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
          <Link href="/" className="font-sans text-lg font-bold tracking-tight text-white">
            Zorixa AI
          </Link>

          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Primary"
          >
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>

          <Link
            href="/login"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Enter App
          </Link>
        </header>

        <div className="flex flex-1 flex-col justify-end px-5 pb-14 pt-8 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-white/15 bg-black/50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
              The AI generation platform
            </p>

            <h1 className="mt-6 font-sans text-[clamp(2.25rem,6vw,4.25rem)] font-black leading-[1.05] tracking-[-0.03em] text-white">
              Generate AI Images &amp; Videos.
            </h1>

            <p className="mt-5 max-w-xl text-base font-normal leading-relaxed text-white/75 sm:text-lg">
              Create stunning AI images and videos. Trusted by creators worldwide.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#2563eb] px-8 text-sm font-bold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
              >
                Start now →
              </Link>
              <Link
                href="/dashboard/history"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-neutral-900/80 px-8 text-sm font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-neutral-800"
              >
                See examples
              </Link>
            </div>

            <p className="mt-12 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
              2M+ images processed <span className="mx-3 text-white/35">|</span> 50K+ creators
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
