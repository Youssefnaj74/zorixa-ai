import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function BillingCancelPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Payment canceled</h1>
      <p className="mt-3 text-sm text-zinc-300">
        No worries — you can pick a plan anytime.
      </p>
      <div className="mt-8">
        <Link href="/dashboard/billing">
          <Button className="bg-white/10 text-white hover:bg-white/15">Back to billing</Button>
        </Link>
      </div>
    </main>
  );
}

