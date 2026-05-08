"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type NavPayload = { href: string; refresh?: boolean };

function runNavigation(router: ReturnType<typeof useRouter>, payload: NavPayload) {
  if (typeof window === "undefined") return;
  if (!router?.push) {
    window.location.assign(payload.href);
    return;
  }
  try {
    router.push(payload.href);
    if (payload.refresh) router.refresh();
  } catch {
    window.location.assign(payload.href);
  }
}

/**
 * Queues App Router navigation to run after mount + the next macrotask, avoiding
 * "Router action dispatched before initialization" when calling from async handlers
 * or immediately after auth state changes.
 */
export function useScheduledAppRouterNavigation() {
  const router = useRouter();
  const pendingRef = useRef<NavPayload | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (tick === 0 || typeof window === "undefined") return;
    const payload = pendingRef.current;
    pendingRef.current = null;
    if (!payload) return;

    const id = window.setTimeout(() => {
      runNavigation(router, payload);
    }, 0);

    // Intentionally do not clearTimeout on cleanup: React Strict Mode would cancel a valid navigation.
    void id;
  }, [tick, router]);

  return useCallback((href: string, options?: { refresh?: boolean }) => {
    if (typeof window === "undefined") return;
    pendingRef.current = { href, refresh: options?.refresh };
    setTick((t) => t + 1);
  }, []);
}
