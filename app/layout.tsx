import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
