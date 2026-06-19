import Link from "next/link";

import { BillingSuccessTracker } from "@/components/analytics/BillingSuccessTracker";
import { Button } from "@/components/ui/button";

export default function BillingSuccessPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <BillingSuccessTracker />
      <h1 className="text-3xl font-semibold tracking-tight">Payment successful</h1>
      <p className="mt-3 text-sm text-zinc-300">
        Your credits will be added automatically in a moment. If your balance does not update within a few
        minutes, refresh the dashboard or contact support with your Dodo receipt.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/dashboard">
          <Button className="bg-white/10 text-white hover:bg-white/15">Go to dashboard</Button>
        </Link>
        <Link href="/pricing">
          <Button variant="ghost" className="text-zinc-300">
            View plans
          </Button>
        </Link>
      </div>
    </main>
  );
}
