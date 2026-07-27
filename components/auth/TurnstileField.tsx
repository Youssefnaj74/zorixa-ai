"use client";

import { useEffect, useRef } from "react";

import { turnstileSiteKey } from "@/lib/turnstile-public";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: "dark" | "light" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

type TurnstileFieldProps = {
  onToken: (token: string | null) => void;
};

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function TurnstileField({ onToken }: TurnstileFieldProps) {
  const siteKey = turnstileSiteKey();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!siteKey || !hostRef.current) return;

    let cancelled = false;

    function mount() {
      if (cancelled || !hostRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(hostRef.current, {
        sitekey: siteKey!,
        theme: "dark",
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(null)
      });
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing && window.turnstile) {
      mount();
    } else if (existing) {
      existing.addEventListener("load", mount);
    } else {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => mount();
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <div className="flex justify-center py-1">
      <div ref={hostRef} />
    </div>
  );
}
