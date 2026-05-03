import useSWR from "swr";

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load");
  return (await res.json()) as { credits_balance: number };
}

export function useCredits() {
  const { data, error, isLoading, mutate } = useSWR("/api/credits", fetcher, {
    refreshInterval: 5000
  });

  return {
    credits: data?.credits_balance ?? 0,
    isLoading,
    error,
    refresh: mutate
  };
}

