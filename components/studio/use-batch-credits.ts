"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchCreditsBalance } from "@/components/studio/batch-jobs";

export function useCreditsBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const b = await fetchCreditsBalance();
    setBalance(b);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { balance, loading, refresh };
}
