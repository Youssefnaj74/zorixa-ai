import { Suspense } from "react";

import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <div className="min-h-dvh bg-[#080810] text-white">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,480px)_1fr]">
        <div className="flex flex-col justify-center px-8 py-16">
          <div className="h-8 w-36 animate-pulse rounded-lg bg-white/5" />
          <div className="mt-10 h-10 w-48 animate-pulse rounded-lg bg-white/5" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded bg-white/5" />
          <div className="mt-8 h-12 w-full max-w-[22rem] animate-pulse rounded-2xl bg-white/5" />
        </div>
        <div className="hidden animate-pulse bg-white/[0.03] lg:block" />
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
