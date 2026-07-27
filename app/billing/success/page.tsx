import { BillingSuccessTracker } from "@/components/analytics/BillingSuccessTracker";
import { BillingSuccessCreditsPoller } from "@/components/billing/BillingSuccessCreditsPoller";

export default function BillingSuccessPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <BillingSuccessTracker />
      <h1 className="text-3xl font-semibold tracking-tight">Payment successful</h1>
      <p className="mt-3 text-sm text-zinc-300">
        Thanks — we&apos;re confirming your credit grant now. This usually takes a few seconds.
      </p>
      <BillingSuccessCreditsPoller />
    </main>
  );
}
