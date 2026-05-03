import { Suspense } from "react";

import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <div className="min-h-dvh bg-zinc-950">
      <div className="mx-auto flex max-w-md flex-col px-6 py-14">
        <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
        <div className="mt-8 h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-white/5" />
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
