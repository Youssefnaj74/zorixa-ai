"use client";

import { useEffect, useState } from "react";

import { MOBILE_NAV_H, NAV_H } from "@/lib/nav-chrome";

const LG_MIN_PX = 1024;

function readIsLgUp(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia(`(min-width: ${LG_MIN_PX}px)`).matches;
}

/** `true` when viewport is Tailwind `lg` (1024px) or wider. */
export function useIsLgUp(): boolean {
  // Match SSR (`readIsLgUp` on the server is always `true`) so inline layout styles hydrate.
  const [isLgUp, setIsLgUp] = useState(true);

  useEffect(() => {
    function update() {
      setIsLgUp(readIsLgUp());
    }

    update();
    const mq = window.matchMedia(`(min-width: ${LG_MIN_PX}px)`);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isLgUp;
}

/** Top chrome height for studio pages — includes the mobile nav strip below `lg`. */
export function useStudioNavOffset(): number {
  const isLgUp = useIsLgUp();
  return isLgUp ? NAV_H : MOBILE_NAV_H;
}
