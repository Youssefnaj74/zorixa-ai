"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Pins composer actions only while the script area remains in view.
 * When the user scrolls to preview/history, actions return to normal flow
 * so nothing floats over page content on small screens.
 */
export function useComposerActionsPin(scriptAreaRef: RefObject<HTMLElement | null>): boolean {
  const [pinActions, setPinActions] = useState(false);

  useEffect(() => {
    const el = scriptAreaRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPinActions(entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [scriptAreaRef]);

  return pinActions;
}
