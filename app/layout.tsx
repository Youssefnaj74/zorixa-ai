import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import Script from "next/script";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { getPublicSiteUrl } from "@/lib/public-site-url";

import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicSiteUrl()),
  title: {
    default: "Zorixa AI — AI image & video generation",
    template: "%s · Zorixa AI"
  },
  description:
    "Generate stunning images and videos with Zorixa AI. Dark-first studio with models, presets, and production-ready exports.",
  openGraph: {
    title: "Zorixa AI",
    description: "AI image and video generation platform for creators and teams.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`min-h-dvh bg-zorixa-bg font-body text-white antialiased ${display.variable} ${body.variable}`}>
        <Script
          src="https://app.lemonsqueezy.com/js/lemon.js"
          strategy="afterInteractive"
          onLoad={() => {
            if (typeof window !== "undefined") window.createLemonSqueezy?.();
          }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
