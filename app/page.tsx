import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ParticleBackground } from "@/components/landing/ParticleBackground";

function LoginFallback() {
  return (
    <div className="mx-auto h-40 max-w-md animate-pulse rounded-2xl bg-zorixa-card/50" aria-hidden />
  );
}

export default function LandingLoginPage() {
  return (
    <AuthLayout>
      <ParticleBackground />
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl flex-1 text-center lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-light">Zorixa AI</p>
          <h1 className="mt-4 bg-gradient-brand bg-clip-text font-display text-5xl font-bold leading-tight text-transparent sm:text-6xl">
            Zorixa AI
          </h1>
          <p className="mt-4 text-lg text-zorixa-muted">
            Generate stunning images &amp; videos with AI
          </p>
          <p className="mt-6 text-sm leading-relaxed text-white/70">
            Sign in to access the studio dashboard, model library, and generation history. New accounts can
            register to unlock credits.
          </p>
        </div>
        <div className="w-full max-w-md flex-1">
          <Suspense fallback={<LoginFallback />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </AuthLayout>
  );
}
