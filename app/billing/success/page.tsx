import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function BillingSuccessPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Payment successful</h1>
      <p className="mt-3 text-sm text-zinc-300">
        Your credits will be added automatically in a moment.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/pricing">
          <Button className="bg-white/10 text-white hover:bg-white/15">View plans</Button>
        </Link>
        <Link href="/dashboard">
          <Button className="bg-violet-500 hover:bg-violet-400">Open dashboard</Button>
        </Link>
      </div>
    </main>
  );
}

