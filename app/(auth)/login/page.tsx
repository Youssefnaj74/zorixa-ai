import { Suspense } from "react";

import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      <div className="grid min-h-dvh lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-14">
          <div className="h-3 w-20 animate-pulse rounded bg-neutral-800" />
          <div className="mt-12 h-16 max-w-md animate-pulse rounded bg-neutral-800" />
          <div className="mt-4 h-16 max-w-md animate-pulse rounded bg-neutral-800" />
        </div>
        <div className="flex items-center justify-center border-t border-neutral-800 px-6 py-14 lg:border-l lg:border-t-0">
          <div className="h-72 w-full max-w-md animate-pulse rounded-2xl bg-neutral-900/80" />
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
