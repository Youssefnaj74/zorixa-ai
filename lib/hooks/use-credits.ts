import useSWR from "swr";

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  return (await res.json()) as { credits_balance: number; is_premium: boolean };
}

export function useCredits() {
  const { data, error, isLoading, mutate } = useSWR("/api/credits", fetcher, {
    refreshInterval: 4000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  return {
    credits: data?.credits_balance ?? 0,
    isPremium: data?.is_premium ?? false,
    isLoading,
    error,
    refresh: mutate
  };
}

