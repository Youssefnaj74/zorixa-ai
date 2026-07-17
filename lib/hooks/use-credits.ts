import { useCallback } from "react";
import useSWR from "swr";

export type CreditsPayload = {
  credits_balance: number;
  is_premium: boolean;
};

async function fetcher(url: string): Promise<CreditsPayload> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  return (await res.json()) as CreditsPayload;
}

export function useCredits() {
  const { data, error, isLoading, mutate } = useSWR("/api/credits", fetcher, {
    refreshInterval: 4000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  /** Push a known balance into the shared SWR cache (navbar + studios stay in sync). */
  const applyBalance = useCallback(
    (balance: number) => {
      if (!Number.isFinite(balance)) return;
      const next = Math.max(0, Math.round(balance));
      void mutate(
        (current) =>
          current
            ? { ...current, credits_balance: next }
            : { credits_balance: next, is_premium: false },
        { revalidate: true }
      );
    },
    [mutate]
  );

  return {
    credits: data?.credits_balance ?? 0,
    isPremium: data?.is_premium ?? false,
    isLoading,
    error,
    refresh: mutate,
    applyBalance
  };
}
