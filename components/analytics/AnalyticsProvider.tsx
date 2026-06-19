"use client";

import Script from "next/script";
import { useEffect } from "react";

import { initPostHog, identifyAnalyticsUser } from "@/lib/analytics";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();

    if (!posthogKey) return;

    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user?.id) {
        identifyAnalyticsUser(user.id, {
          email: user.email ?? undefined
        });
      }
    })();
  }, []);

  return (
    <>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
              window.gtag = gtag;
            `}
          </Script>
        </>
      ) : null}
      {children}
    </>
  );
}
