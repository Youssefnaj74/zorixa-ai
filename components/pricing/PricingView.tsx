"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, ChevronDown, Zap } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { NAV_H } from "@/lib/nav-chrome";
import {
  dismissStarterPassGift,
  StarterPassGiftModal,
  wasStarterPassGiftDismissed
} from "@/components/onboarding/StarterPassGiftModal";
import { WelcomePricingBanner } from "@/components/onboarding/WelcomePricingBanner";
import {
  CREDIT_PACKS,
  STARTER_PASS,
  formatCredits,
  PRICING_CATALOG_SECTIONS,
  PRICING_CREDIT_VARIANCE_NOTE
} from "@/lib/atlas-pricing-catalog";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { DodoPackId } from "@/lib/dodo-payments/config";
import { startDodoCheckout } from "@/lib/dodo-payments/start-checkout";
import { formatInteger } from "@/lib/format-number";
import { usePricingViewed } from "@/lib/hooks/use-pricing-viewed";
import { cn } from "@/lib/utils";

const STUDIO_WORKFLOWS = [
  "Text to Video",
  "Image to Video",
  "Text to Image",
  "Image to Image",
  "Character Swap",
  "Audio to Video"
] as const;

function perCreditSavingsPercent(packCredits: number, price: number): number | null {
  const starter = CREDIT_PACKS.find((pack) => pack.id === "starter");
  if (!starter || packCredits <= 0 || price <= 0) return null;

  const starterCredits = starter.credits;
  if (starterCredits <= 0) return null;

  const starterUnit = starter.monthly / starterCredits;
  const unit = price / packCredits;
  const savings = Math.round((1 - unit / starterUnit) * 100);
  return savings > 0 ? savings : null;
}

function formatPlanPrice(amount: number): string {
  return amount.toFixed(2).replace(/\.00$/, "");
}

function formatPerCreditUsd(price: number, credits: number): string {
  const perCredit = Math.floor((price / credits) * 10_000) / 10_000;
  return `$${perCredit.toFixed(4).replace(/\.?0+$/, "")} per credit`;
}

function packCreditValueLabel(
  packId: string,
  price: number,
  credits: number,
  savingsPercent: number | null
): string {
  if (packId === "ultra") return "Best credit value";
  if (packId === "starter") return formatPerCreditUsd(price, credits);
  if (savingsPercent) return `Save ${savingsPercent}% per credit`;
  return formatPerCreditUsd(price, credits);
}

export function PricingView() {
  const searchParams = useSearchParams();
  const showWelcome = searchParams.get("welcome") === "1";
  usePricingViewed(showWelcome ? "signup_welcome" : "pricing_page");

  const [openSection, setOpenSection] = useState<string>("image");
  const [userId, setUserId] = useState<string | null>(null);
  const [starterPassAvailable, setStarterPassAvailable] = useState(false);
  const [eligibilityReady, setEligibilityReady] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftDismissed, setGiftDismissed] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState<DodoPackId | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    void createSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId) {
      setStarterPassAvailable(false);
      setEligibilityReady(true);
      setGiftOpen(false);
      setGiftDismissed(false);
      return;
    }
    setEligibilityReady(false);
    const dismissed = wasStarterPassGiftDismissed();
    setGiftDismissed(dismissed);
    void fetch("/api/credits", { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          setStarterPassAvailable(false);
          return;
        }
        const body = (await res.json()) as {
          starter_pass_available?: boolean;
          is_premium?: boolean;
          starter_pass_purchased_at?: string | null;
        };
        const available =
          typeof body.starter_pass_available === "boolean"
            ? body.starter_pass_available
            : !body.is_premium && !body.starter_pass_purchased_at;
        setStarterPassAvailable(available);
        if (available && !dismissed) {
          setGiftOpen(true);
        }
      })
      .catch(() => {
        setStarterPassAvailable(false);
      })
      .finally(() => setEligibilityReady(true));
  }, [userId]);

  async function onCheckout(packId: DodoPackId, billing: "monthly" | "one_time") {
    if (!userId) {
      window.location.href = "/login?redirect=/pricing";
      return;
    }
    setCheckoutError(null);
    setCheckoutBusy(packId);
    try {
      await startDodoCheckout(packId, billing);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Could not start checkout.");
      setCheckoutBusy(null);
    }
  }

  function onDismissGift() {
    dismissStarterPassGift();
    setGiftDismissed(true);
    setGiftOpen(false);
  }

  const showClaimChip =
    Boolean(userId) && eligibilityReady && starterPassAvailable && giftDismissed && !giftOpen;

  return (
    <>
      <Navbar />
      <StarterPassGiftModal
        open={Boolean(userId) && eligibilityReady && starterPassAvailable && giftOpen}
        busy={checkoutBusy === STARTER_PASS.id}
        onClaim={() => void onCheckout(STARTER_PASS.id, "one_time")}
        onDismiss={onDismissGift}
      />
      {showClaimChip ? (
        <div className="fixed bottom-5 left-1/2 z-[70] w-[min(100%-1.5rem,22rem)] -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0">
          <button
            type="button"
            disabled={checkoutBusy !== null}
            onClick={() => void onCheckout(STARTER_PASS.id, "one_time")}
            className="flex w-full flex-col items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/95 px-5 py-3 text-black shadow-[0_12px_40px_rgba(16,185,129,0.35)] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
          >
            <span className="text-sm font-bold">
              {checkoutBusy === STARTER_PASS.id
                ? "Opening checkout…"
                : `Unlock Starter Pass — $${STARTER_PASS.priceUsd.toFixed(2)}`}
            </span>
            {checkoutBusy !== STARTER_PASS.id ? (
              <span className="mt-0.5 text-[10px] font-medium text-black/60">
                One-time · New users only · No subscription
              </span>
            ) : null}
          </button>
        </div>
      ) : null}
      <div className="min-h-dvh bg-[#080810] font-body text-white" style={{ paddingTop: NAV_H + 24 }}>
        <div className="mx-auto max-w-7xl px-6 pb-24">
          {showWelcome ? <WelcomePricingBanner /> : null}
          {/* Header */}
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00e5ff]">View Plans</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Credits &amp; model pricing
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
              New users can claim a one-time $0.99 Starter Pass, or subscribe monthly for more
              credits. Credits stack until you use them. Yearly billing is not available yet.
            </p>

            {checkoutError ? (
              <p className="mx-auto mt-4 max-w-lg text-center text-sm text-red-300">{checkoutError}</p>
            ) : null}
          </div>

          {/* Starter Pass (left) + monthly packs */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
            <div className="relative flex flex-col rounded-2xl border border-emerald-400/70 bg-[#0f0f1e] p-5 shadow-[0_0_36px_rgba(52,211,153,0.18)] sm:col-span-2 xl:col-span-1">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-emerald-400/45 bg-[#0f0f1e]/80 px-4 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.22)] backdrop-blur-md">
                Trial
              </div>

              <h2 className="text-base font-bold">{STARTER_PASS.name}</h2>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">${formatPlanPrice(STARTER_PASS.priceUsd)}</span>
                <span className="text-sm text-white/40">one-time</span>
              </div>

              <div className="mb-4 mt-3 border-b border-white/10 pb-4">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <Zap className="size-3.5 text-emerald-300" aria-hidden />
                  <span className="font-semibold text-emerald-300">
                    {formatInteger(STARTER_PASS.credits)} credits
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-medium text-white/50">No auto-renewal</p>
              </div>

              <p className="text-sm font-semibold text-white">For new users only</p>
              <p className="mt-1 text-xs leading-relaxed text-white/45">
                One-time purchase — unlocks premium models
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/40">{STARTER_PASS.tagline}</p>

              <ul className="mb-6 mt-4 flex flex-col gap-2 border-b border-white/10 pb-6">
                {STUDIO_WORKFLOWS.map((workflow) => (
                  <li key={workflow} className="flex items-start gap-2 text-sm text-white/55">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden />
                    {workflow}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={
                  checkoutBusy !== null || (Boolean(userId) && !starterPassAvailable)
                }
                onClick={() => void onCheckout(STARTER_PASS.id, "one_time")}
                className="mb-2 w-full rounded-full bg-emerald-400 py-3 text-sm font-bold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {!userId
                  ? "Sign in to subscribe"
                  : checkoutBusy === STARTER_PASS.id
                    ? "Opening checkout…"
                    : !starterPassAvailable
                      ? "Not available"
                      : `Unlock Starter Pass — $${STARTER_PASS.priceUsd.toFixed(2)}`}
              </button>

              <p className="mb-6 text-center text-[11px] leading-relaxed text-white/40">
                One-time purchase · New users only · No subscription
              </p>

              <p className="mb-3 text-[11px] uppercase tracking-widest text-white/35">Includes</p>
              <ul className="flex flex-1 flex-col gap-2.5">
                {STARTER_PASS.highlights.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/55">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {CREDIT_PACKS.map((pack) => {
              const displayPrice = pack.monthly;
              const displayCredits = pack.credits;
              const savingsPercent = perCreditSavingsPercent(displayCredits, displayPrice);
              const isUltra = pack.id === "ultra";
              const accentIcon = isUltra ? "text-orange-300" : "text-[#00e5ff]";
              return (
                <div
                  key={pack.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl p-5 transition-shadow",
                    isUltra
                      ? "border border-orange-400/70 bg-[#0f0f1e] shadow-[0_0_36px_rgba(251,146,60,0.18)]"
                      : pack.popular
                        ? "border border-[#00e5ff]/80 bg-[#0f0f1e] shadow-[0_0_36px_rgba(0,229,255,0.18)]"
                        : "border border-white/10 bg-[#0f0f1e]"
                  )}
                >
                  {pack.popular ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#00e5ff]/40 bg-[#0f0f1e]/80 px-4 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#00e5ff] shadow-[0_0_24px_rgba(0,229,255,0.22)] backdrop-blur-md">
                      POPULAR
                    </div>
                  ) : null}
                  {isUltra ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-orange-400/45 bg-[#0f0f1e]/80 px-4 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-orange-300 shadow-[0_0_24px_rgba(251,146,60,0.22)] backdrop-blur-md">
                      Ultra
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
                    <span className="text-4xl font-extrabold">${formatPlanPrice(displayPrice)}</span>
                    <span className="text-sm text-white/40">/month</span>
                  </div>

                  <div className="mb-4 mt-3 border-b border-white/10 pb-4">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <Zap className={cn("size-3.5", accentIcon)} aria-hidden />
                      <span className={cn("font-semibold", accentIcon)}>
                        {formatInteger(displayCredits)} credits
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-white/50">
                      {packCreditValueLabel(pack.id, displayPrice, displayCredits, savingsPercent)}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-white">Access 30+ AI models</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/45">
                    Credits scale across image and video generation
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-white/40">{pack.tagline}</p>

                  <ul className="mb-6 mt-4 flex flex-col gap-2 border-b border-white/10 pb-6">
                    {STUDIO_WORKFLOWS.map((workflow) => (
                      <li key={workflow} className="flex items-start gap-2 text-sm text-white/55">
                        <Check className={cn("mt-0.5 size-4 shrink-0", accentIcon)} aria-hidden />
                        {workflow}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={checkoutBusy !== null}
                    onClick={() => void onCheckout(pack.id, "monthly")}
                    className={cn(
                      "mb-6 w-full rounded-full py-3 text-sm font-bold transition-all disabled:cursor-wait disabled:opacity-70",
                      isUltra
                        ? "bg-orange-400 text-black hover:brightness-110"
                        : pack.popular
                          ? "bg-[#00e5ff] text-black hover:brightness-110"
                          : "border border-white/15 bg-white/[0.04] text-white hover:border-[#00e5ff]/40"
                    )}
                  >
                    {!userId
                      ? "Sign in to subscribe"
                      : checkoutBusy === pack.id
                        ? "Opening checkout…"
                        : "Subscribe now"}
                  </button>

                  <p className="mb-3 text-[11px] uppercase tracking-widest text-white/35">Includes</p>
                  <ul className="flex flex-1 flex-col gap-2.5">
                    {pack.highlights.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/55">
                        <Check className={cn("mt-0.5 size-4 shrink-0", accentIcon)} aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-white/40">
            Usage varies by model.{" "}
            <a href="#credits-per-model" className="text-[#00e5ff] hover:text-white">
              See Credits per Model →
            </a>
            <br />
            <span className="mt-1 inline-block">{PRICING_CREDIT_VARIANCE_NOTE}</span>
          </p>

          {/* Model pricing */}
          <section id="credits-per-model" className="mt-20 scroll-mt-24">
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
