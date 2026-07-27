"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Clock, X } from "lucide-react";

import { STARTER_PASS } from "@/lib/atlas-pricing-catalog";
import { formatInteger } from "@/lib/format-number";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "zorixa:starter-pass-gift-dismissed";
const SETUP_DEADLINE_KEY = "zorixa:starter-pass-setup-deadline";
const SETUP_WINDOW_MS = 10 * 60 * 1000;

function readSetupDeadline(): number {
  try {
    const raw = sessionStorage.getItem(SETUP_DEADLINE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed) && parsed > Date.now()) return parsed;
    const next = Date.now() + SETUP_WINDOW_MS;
    sessionStorage.setItem(SETUP_DEADLINE_KEY, String(next));
    return next;
  } catch {
    return Date.now() + SETUP_WINDOW_MS;
  }
}

function formatMmSs(msLeft: number): string {
  const totalSec = Math.max(0, Math.ceil(msLeft / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const VALUE_POINTS = [
  `${formatInteger(STARTER_PASS.credits)} credits to try the studio`,
  "Premium AI models unlocked (Kling, Veo, Hailuo…)",
  "One-time offer for new users — no auto-renewal"
] as const;

const CONFETTI = [
  { top: "8%", left: "6%", rotate: "12deg", color: "#a78bfa", size: 10 },
  { top: "14%", left: "88%", rotate: "-18deg", color: "#34d399", size: 8 },
  { top: "22%", left: "18%", rotate: "40deg", color: "#fbbf24", size: 7 },
  { top: "28%", left: "72%", rotate: "8deg", color: "#60a5fa", size: 9 },
  { top: "38%", left: "4%", rotate: "-25deg", color: "#f472b6", size: 8 },
  { top: "48%", left: "92%", rotate: "30deg", color: "#34d399", size: 11 },
  { top: "58%", left: "12%", rotate: "15deg", color: "#fbbf24", size: 7 },
  { top: "66%", left: "80%", rotate: "-10deg", color: "#a78bfa", size: 9 },
  { top: "74%", left: "28%", rotate: "22deg", color: "#60a5fa", size: 8 },
  { top: "82%", left: "64%", rotate: "-35deg", color: "#f472b6", size: 10 },
  { top: "18%", left: "48%", rotate: "55deg", color: "#34d399", size: 6 },
  { top: "88%", left: "42%", rotate: "5deg", color: "#fbbf24", size: 8 }
] as const;

export function StarterPassGiftModal({
  open,
  busy,
  error,
  onClaim,
  onDismiss
}: {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onClaim: () => void;
  onDismiss: () => void;
}) {
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    setDeadline(readSetupDeadline());
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  const mmss = useMemo(() => {
    if (!deadline) return "10:00";
    return formatMmSs(deadline - now);
  }, [deadline, now]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8">
      <button
        type="button"
        aria-label="Close offer"
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        onClick={onDismiss}
      />

      {CONFETTI.map((piece, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute z-[81] rounded-[2px] opacity-90"
          style={{
            top: piece.top,
            left: piece.left,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotate})`
          }}
        />
      ))}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="starter-pass-gift-title"
        className={cn(
          "relative z-[82] w-full max-w-[420px] overflow-hidden rounded-3xl border border-white/10 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-7",
          "bg-[radial-gradient(circle_at_85%_10%,rgba(52,211,153,0.35),transparent_42%),linear-gradient(160deg,#141b3a_0%,#1a1240_55%,#0d1024_100%)]"
        )}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onDismiss}
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>

        <p className="text-sm font-semibold text-white/90">Welcome Offer</p>
        <h2
          id="starter-pass-gift-title"
          className="mt-1 font-display text-2xl font-extrabold tracking-tight text-emerald-300 sm:text-[1.7rem]"
        >
          Welcome to ZorixaAI
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Unlock your Starter Pass — reserved for new accounts.
        </p>

        <ul className="mt-4 space-y-2.5">
          {VALUE_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm text-white/85">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden />
              {point}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-lg font-extrabold text-white">
          Only ${STARTER_PASS.priceUsd.toFixed(2)}
          <span className="ml-2 text-sm font-semibold text-white/45">one-time</span>
        </p>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Clock className="size-4 shrink-0 text-white/70" aria-hidden />
            <span>Complete your setup in</span>
          </div>
          <p className="mt-1 font-display text-4xl font-black tabular-nums tracking-tight text-lime-300">
            {mmss}
          </p>
          <p className="mt-1 text-sm text-white/65">
            A gentle nudge to finish onboarding — your Starter Pass stays available on Pricing while
            you&apos;re eligible as a new user.
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={onClaim}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 py-3.5 text-sm font-bold text-black transition hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
        >
          {busy
            ? "Opening checkout…"
            : `Unlock Starter Pass — $${STARTER_PASS.priceUsd.toFixed(2)}`}
          {!busy ? <ArrowRight className="size-4" aria-hidden /> : null}
        </button>

        {error ? (
          <p className="mt-2 text-center text-sm leading-relaxed text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <p className="mt-2 text-center text-[11px] leading-relaxed text-white/45">
          One-time purchase · New users only · No subscription
        </p>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 w-full py-2 text-center text-sm font-semibold text-lime-300/90 transition hover:text-lime-200"
        >
          No thanks, skip for now
        </button>
      </div>
    </div>
  );
}

export function wasStarterPassGiftDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissStarterPassGift(): void {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}
