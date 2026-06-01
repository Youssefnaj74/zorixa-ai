import { Suspense } from "react";

import { SupportForm } from "./support-form";

export const metadata = {
  title: "Support",
  description: "Contact Zorixa AI support — tell us your name, email, and what went wrong."
};

function SupportFallback() {
  return (
    <div className="min-h-dvh bg-[#080810] pt-20">
      <div className="mx-auto max-w-lg animate-pulse px-6 py-12">
        <div className="h-8 w-48 rounded-lg bg-white/5" />
        <div className="mt-3 h-4 w-72 rounded bg-white/5" />
        <div className="mt-10 space-y-4">
          <div className="h-12 rounded-xl bg-white/5" />
          <div className="h-12 rounded-xl bg-white/5" />
          <div className="h-32 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<SupportFallback />}>
      <SupportForm />
    </Suspense>
  );
}
