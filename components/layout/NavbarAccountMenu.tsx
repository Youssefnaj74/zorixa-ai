"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  avatarLetter?: string;
  dashboardAuthBar?: boolean;
};

export function NavbarAccountMenu({ avatarLetter, dashboardAuthBar }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onDocMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const initial = avatarLetter?.trim().slice(0, 1).toUpperCase();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="grid size-9 place-items-center rounded-full border border-brand/40 bg-gradient-brand/25 font-display text-sm font-bold text-white ring-1 ring-brand/50 transition-opacity hover:opacity-90"
      >
        {initial ? <span>{initial}</span> : <span className="text-xs">?</span>}
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        className={cn(
          "absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] overflow-hidden rounded-xl border border-white/[0.08] bg-zorixa-bg shadow-[0_8px_40px_rgba(0,0,0,0.6)] transition-[opacity,transform] duration-150 ease-out",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1.5 opacity-0"
        )}
      >
        {/* Top row: View Plans + Settings */}
        <div className="flex items-center gap-2 px-5 pb-2 pt-4">
          <Link
            href="/dashboard/billing"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="rounded-[20px] bg-white px-4 py-1.5 text-sm font-normal text-black transition-opacity hover:opacity-90"
          >
            View Plans
          </Link>
          <Link
            href="/dashboard/billing"
            role="menuitem"
            aria-label="Settings"
            onClick={() => setOpen(false)}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/[0.15] bg-zorixa-bg-secondary/80 text-white transition-opacity hover:opacity-80"
          >
            <Settings className="size-4" strokeWidth={1.75} aria-hidden />
          </Link>
        </div>

        <nav className="flex flex-col pb-2 pt-1" aria-label="Account">
          <Link
            href="/dashboard/billing"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="px-5 py-3 text-sm font-normal text-white transition-opacity hover:opacity-70"
          >
            Subscription
          </Link>
          <Link
            href="/dashboard/history"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="px-5 py-3 text-sm font-normal text-white transition-opacity hover:opacity-70"
          >
            Usage
          </Link>
          <Link
            href="/dashboard/billing"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="px-5 py-3 text-sm font-normal text-white transition-opacity hover:opacity-70"
          >
            API Access
          </Link>
          <Link
            href="/"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="px-5 py-3 text-sm font-normal text-white transition-opacity hover:opacity-70"
          >
            Support
          </Link>

          {dashboardAuthBar ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-normal text-white transition-opacity hover:opacity-70"
            >
              <ArrowRight className="size-4 shrink-0 opacity-90" aria-hidden />
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-normal text-white transition-opacity hover:opacity-70"
            >
              <ArrowRight className="size-4 shrink-0 opacity-90" aria-hidden />
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
