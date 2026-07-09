/** Below-fold reveal: fade + slide (opacity 0 until in view). */
export const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } }
};

/** Above-fold hero: slide only — visible in SSR HTML for LCP (opacity stays 1). */
export const heroReveal = {
  hidden: { opacity: 1, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } }
};

/** Route template: slide only — no SSR opacity gate. */
export const pageEnter = {
  initial: { opacity: 1, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }
};
