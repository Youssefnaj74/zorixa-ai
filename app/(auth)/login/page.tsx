import { Suspense } from "react";

import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="grid min-h-dvh lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
          <div className="h-3 w-16 animate-pulse rounded bg-neutral-800" />
          <div className="mt-14 h-14 max-w-xs animate-pulse rounded bg-neutral-900 sm:h-16" />
          <div className="mt-3 h-14 max-w-xs animate-pulse rounded bg-neutral-900 sm:h-16" />
        </div>
        <div className="flex items-center justify-center border-t border-[#1a1a1a] px-6 py-14 lg:border-l lg:border-t-0">
          <div className="h-64 w-full max-w-[22rem] animate-pulse rounded-xl bg-[#0a0a0a]" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
