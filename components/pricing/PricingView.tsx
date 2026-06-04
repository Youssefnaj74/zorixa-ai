"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronDown, Zap } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import {
  CREDIT_PACKS,
  formatCredits,
  PRICING_CATALOG_SECTIONS
} from "@/lib/atlas-pricing-catalog";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getLemonSqueezyCheckoutUrl } from "@/lib/lemon-squeezy/checkout-url";
import { formatInteger } from "@/lib/format-number";
import { cn } from "@/lib/utils";

function perCreditSavingsPercent(packCredits: number, price: number): number | null {
  const starter = CREDIT_PACKS.find((pack) => pack.id === "starter");
  if (!starter || packCredits <= 0 || price <= 0 || starter.credits <= 0) return null;

  const starterUnit = starter.monthly / starter.credits;
  const unit = price / packCredits;
  const savings = Math.round((1 - unit / starterUnit) * 100);
  return savings > 0 ? savings : null;
}

export function PricingView() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [openSection, setOpenSection] = useState<string>("image");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    void createSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  function onSubscribe() {
    if (!userId) {
      window.location.href = "/login?redirect=/pricing";
      return;
    }
    const url = getLemonSqueezyCheckoutUrl(userId);
    if (url && typeof window !== "undefined" && "LemonSqueezy" in window) {
      const LemonSqueezy = (window as Window & { LemonSqueezy?: { Url?: { Open: (u: string) => void } } })
        .LemonSqueezy;
      LemonSqueezy?.Url?.Open(url);
      return;
    }
    if (url) window.location.href = url;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-dvh bg-[#080810] pt-20 font-body text-white">
        <div className="mx-auto max-w-7xl px-6 pb-24">
          {/* Header */}
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00e5ff]">View Plans</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Credits &amp; model pricing
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
              Buy credits once, use any model in the studio. Each generation deducts credits from
              your balance — rates below are per run.
            </p>

            <div className="mt-6 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={cn(
                  "rounded-full px-6 py-2 text-sm font-bold transition-all",
                  billing === "monthly" ? "bg-[#00e5ff] text-black" : "text-white/45"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("yearly")}
                className={cn(
                  "flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition-all",
                  billing === "yearly" ? "bg-[#00e5ff] text-black" : "text-white/45"
                )}
              >
                Yearly
                <span className="rounded-full bg-emerald-950/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400">
                  −10%
                </span>
              </button>
            </div>
          </div>

          {/* Credit packs */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {CREDIT_PACKS.map((pack) => {
              const price = billing === "monthly" ? pack.monthly : pack.yearly;
              const savingsPercent = perCreditSavingsPercent(pack.credits, price);
              return (
                <div
                  key={pack.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl p-5 transition-shadow",
                    pack.popular
                      ? "border border-[#00e5ff]/80 bg-[#0f0f1e] shadow-[0_0_36px_rgba(0,229,255,0.18)]"
                      : "border border-white/10 bg-[#0f0f1e]"
                  )}
                >
                  {pack.popular ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#00e5ff]/40 bg-[#0f0f1e]/80 px-4 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#00e5ff] shadow-[0_0_24px_rgba(0,229,255,0.22)] backdrop-blur-md">
                      POPULAR
                    </div>
                  ) : null}
                  {savingsPercent ? (
                    <div className="absolute right-0 top-0 overflow-hidden rounded-tr-2xl">
                      <div className="rounded-bl-2xl border-b border-l border-red-400/30 bg-red-500/[0.08] px-3.5 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_20px_rgba(248,113,113,0.12)] backdrop-blur-md">
                        <span className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-red-300">
                          Save {savingsPercent}%
                        </span>
                        <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.14em] text-red-100/45">
                          per credit
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <h2 className="text-base font-bold">{pack.name}</h2>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">${price}</span>
                    <span className="text-sm text-white/40">/month</span>
                  </div>

                  <div className="mb-6 mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-white/10 pb-6 text-sm">
                    <Zap className="size-3.5 text-[#00e5ff]" aria-hidden />
                    <span className="font-semibold text-[#00e5ff]">
                      {formatInteger(pack.credits)} credits
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onSubscribe}
                    className={cn(
                      "mb-6 w-full rounded-full py-3 text-sm font-bold transition-all",
                      pack.popular
                        ? "bg-[#00e5ff] text-black hover:brightness-110"
                        : "border border-white/15 bg-white/[0.04] text-white hover:border-[#00e5ff]/40"
                    )}
                  >
                    {userId ? "Subscribe now" : "Sign in to subscribe"}
                  </button>

                  <p className="mb-3 text-[11px] uppercase tracking-widest text-white/35">Includes</p>
                  <ul className="flex flex-1 flex-col gap-2.5">
                    {pack.highlights.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/55">
                        <Check className="mt-0.5 size-4 shrink-0 text-[#00e5ff]" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Model pricing */}
          <section className="mt-20">
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold">Credits per model</h2>
              <p className="mt-1 max-w-xl text-sm text-white/45">
                What each generation costs in credits. Video rates below use 5s, 720p,
                Standard tier, without soundtrack; the studio updates the final charge live
                for duration, resolution, speed, and audio.
              </p>
            </div>

            <div className="space-y-3">
              {PRICING_CATALOG_SECTIONS.map((section) => {
                const open = openSection === section.id;
                return (
                  <div
                    key={section.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f1e]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenSection(open ? "" : section.id)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left"
                      aria-expanded={open}
                    >
                      <span className="font-semibold">{section.title}</span>
                      <span className="flex items-center gap-3 text-sm text-white/40">
                        {section.models.length} models
                        <ChevronDown
                          className={cn("size-4 transition-transform", open && "rotate-180")}
                          aria-hidden
                        />
                      </span>
                    </button>

                    {open ? (
                      <div className="border-t border-white/10">
                        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-0 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/30 max-md:hidden">
                          <span>Model</span>
                          <span className="text-right">Credits</span>
                          <span className="text-right">Per</span>
                        </div>
                        {section.models.map((model) => (
                          <div
                            key={model.id}
                            className="grid grid-cols-1 gap-1 border-t border-white/[0.06] px-5 py-3.5 text-sm max-md:gap-2 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-x-4"
                          >
                            <div>
                              <p className="font-medium text-white/90">{model.name}</p>
                              {model.note ? (
                                <p className="text-xs text-white/35">{model.note}</p>
                              ) : null}
                            </div>
                            <p className="font-semibold text-[#00e5ff] md:text-right">
                              <span className="mr-2 text-white/35 md:hidden">Credits:</span>
                              {formatCredits(model.creditsCharged)}
                            </p>
                            <p className="text-xs text-white/40 md:text-right">{model.unit}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <p className="mt-10 text-center text-xs text-white/30">
            Need help choosing?{" "}
            <Link href="/helpsupport" className="text-[#00e5ff] hover:text-white">
              Contact support
            </Link>
            {" · "}
            Credits are deducted per generation based on the model you use.
          </p>
        </div>
      </div>
    </>
  );
}
